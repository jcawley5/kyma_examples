package main

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/asn1"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io/ioutil"
	"log"
	"math/big"
	"net/http"
	"net/http/httputil"
	"os"
	"path"
	"runtime"
	"strings"
	"text/template"
	"time"
)

type kymaDetails struct {
	Created             time.Time
	AppPath             string
	CsrURL              string `json:"csrUrl"`
	KymaClientCrtExists bool
	ResponseData        string
	HTTPTLSClient       *http.Client
	API                 struct {
		EventsInfoURL   string `json:"eventsInfoUrl"`
		EventsURL       string `json:"eventsUrl"`
		MetadataURL     string `json:"metadataUrl"`
		InfoURL         string `json:"infoUrl"`
		CertificatesURL string `json:"certificatesUrl"`
	} `json:"api"`
	Certificate struct {
		Subject      string `json:"subject"`
		Extensions   string `json:"extensions"`
		KeyAlgorithm string `json:"key-algorithm"`
	} `json:"certificate"`
}

//CSRConnectResponse contains crt for tls communication
type CSRConnectResponse struct {
	Crt       string `json:"crt,omitempty"`
	ClientCrt string `json:"clientCrt,omitempty"`
	CaCrt     string `json:"caCrt,omitempty"`
}

// var oidEmailAddress = asn1.ObjectIdentifier{1, 2, 840, 113549, 1, 9, 1}

func main() {

	var kd kymaDetails

	http.HandleFunc("/", kd.index)
	http.HandleFunc("/newKymaConnection", kd.newKymaConnection)
	http.HandleFunc("/sendCSRToKyma", kd.sendCSRToKyma)
	http.HandleFunc("/clearKymaInfo", kd.clearKymaInfo)
	http.HandleFunc("/getKymaMetedata", kd.getKymaMetedata)
	http.HandleFunc("/sendAPIMetadata", kd.sendAPIMetadata)
	http.HandleFunc("/sendPetCreatedEvent", kd.sendPetCreatedEvent)
	http.HandleFunc("/apiEndpointPrint", kd.apiEndpointPrint)

	fmt.Println("Server is up and listening on port: 443.")
	kd.setAppPaths()

	err := http.ListenAndServeTLS(":443", kd.AppPath+"/server/server.crt", kd.AppPath+"/server/server.key", nil)

	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func (kd *kymaDetails) apiEndpointPrint(response http.ResponseWriter, request *http.Request) {
	// Save a copy of this request for debugging.
	requestDump, err := httputil.DumpRequest(request, true)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(string(requestDump))
}

func (kd *kymaDetails) index(response http.ResponseWriter, request *http.Request) {

	isConnected := true
	kymaConnectDetails, err := ioutil.ReadFile(kd.AppPath + "/kyma/kymaConnectDetails.json")
	if err != nil {
		log.Println("could not read kymaConnectDetails.json - it may not exist yet...")
		isConnected = false
	} else {
		_ = json.Unmarshal([]byte(kymaConnectDetails), kd)
	}

	if isConnected {
		kd.kymaClientCrtExists()
		tmpl := template.Must(template.ParseFiles("./static/indexConnected.html"))
		tmpl.Execute(response, &kd)
	} else {
		http.ServeFile(response, request, "./static/index.html")
	}

}

func (kd *kymaDetails) kymaClientCrtExists() error {

	crtFile, err := os.Open(kd.AppPath + "/kyma/ClientCrt.crt")
	var fileSize int64
	if err != nil {
		log.Println("could not read ClientCrt.crt - it may not exist...")
		return err
	} else {
		fi, err := crtFile.Stat()
		if err != nil {
			log.Println("ClientCrt.crt can not be determined")
			return err
		}
		fileSize = fi.Size()
		fmt.Println(fileSize)
		kd.KymaClientCrtExists = true

		kd.setTLSClient()
	}
	return nil
}

func (kd *kymaDetails) newKymaConnection(response http.ResponseWriter, request *http.Request) {

	fmt.Println("method:", request.Method)
	if request.Method == "POST" {
		kd.getKymaDetails(response, request)
	} else {
		kd.goToIndex(response, request)
	}
}

//call to kyma - in response receives...
//URL to which a third-party solution sends its Certificate Signing Request (CSR)
//the URL of the metadata endpoint
//information required to generate a CSR
func (kd *kymaDetails) getKymaDetails(response http.ResponseWriter, request *http.Request) {
	kymaURL := request.FormValue("kymaUrl")
	resp, err := http.Get(kymaURL)
	if err != nil {
		log.Fatalln(err)
	}

	responseBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	kd.Created = time.Now().Local()

	err = json.Unmarshal(responseBody, kd)

	//write the result into a file for use on restart
	//file, _ := json.MarshalIndent(&kd, "", " ")
	ioutil.WriteFile(kd.AppPath+"/kyma/kymaConnectDetails.json", responseBody, 0644)

	if err != nil {
		panic(err)
	}

	log.Println(string(responseBody))
	kd.ResponseData = string(responseBody)
	kd.goToConnectedIndexPage(response, request)
}

func (kd *kymaDetails) goToIndex(response http.ResponseWriter, request *http.Request) {
	http.ServeFile(response, request, "./static/index.html")
}

func (kd *kymaDetails) goToConnectedIndexPage(response http.ResponseWriter, request *http.Request) {
	request.ParseForm()
	tmpl := template.Must(template.ParseFiles("./static/indexConnected.html"))
	tmpl.Execute(response, &kd)
}

func (kd *kymaDetails) generateCSR(subject string) string {

	//O=779819ed-9649-472c-b1b9-2d153935cbfd,OU=c4demov11,L=Waldorf,ST=Waldorf,C=DE,CN=test1,

	keyBytes, _ := rsa.GenerateKey(rand.Reader, 2048)

	subjectTrimed := strings.TrimSuffix(subject, ",")
	entries := strings.Split(subjectTrimed, ",")
	subjectMapped := make(map[string]string)

	for _, e := range entries {
		parts := strings.Split(e, "=")
		subjectMapped[parts[0]] = parts[1]
	}

	subj := pkix.Name{
		CommonName:         subjectMapped["CN"],
		Country:            []string{subjectMapped["C"]},
		Province:           []string{subjectMapped["ST"]},
		Locality:           []string{subjectMapped["L"]},
		Organization:       []string{subjectMapped["O"]},
		OrganizationalUnit: []string{subjectMapped["OU"]},
	}

	type basicConstraints struct {
		IsCA       bool `asn1:"optional"`
		MaxPathLen int  `asn1:"optional,default:-1"`
	}

	val, _ := asn1.Marshal(basicConstraints{true, 0})

	var csrTemplate = x509.CertificateRequest{
		Subject:            subj,
		SignatureAlgorithm: x509.SHA256WithRSA,
		ExtraExtensions: []pkix.Extension{
			{
				Id:       asn1.ObjectIdentifier{2, 5, 29, 19},
				Value:    val,
				Critical: true,
			},
		},
	}

	csrBytes, _ := x509.CreateCertificateRequest(rand.Reader, &csrTemplate, keyBytes)

	csr := pem.EncodeToMemory(&pem.Block{
		Type: "CERTIFICATE REQUEST", Bytes: csrBytes,
	})
	ioutil.WriteFile(kd.AppPath+"/kyma/tlscsr.csr", csr, 0644)

	// step: generate a serial number
	serial, _ := rand.Int(rand.Reader, (&big.Int{}).Exp(big.NewInt(2), big.NewInt(159), nil))

	now := time.Now()
	// step: create the request template
	template := x509.Certificate{
		SerialNumber:          serial,
		Subject:               subj,
		NotBefore:             now.Add(-10 * time.Minute).UTC(),
		NotAfter:              now.Add(time.Duration(1200)).UTC(),
		BasicConstraintsValid: true,
		IsCA:                  true,
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth},
	}

	// step: sign the certificate authority
	certificate, _ := x509.CreateCertificate(rand.Reader, &template, &template, &keyBytes.PublicKey, keyBytes)

	kymaServerCrt := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: certificate})
	ioutil.WriteFile(kd.AppPath+"/kyma/TLSServerCrt.crt", kymaServerCrt, 0644)

	kymaServerPrivateKey := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(keyBytes)})
	ioutil.WriteFile(kd.AppPath+"/kyma/TLSServerPrivateKey.key", kymaServerPrivateKey, 0644)

	return string(csr)
}

//send to Kyma CSR
//in response receives a signed certificate to be saved and used to authentication and communicate with Kyma
func (kd *kymaDetails) sendCSRToKyma(response http.ResponseWriter, request *http.Request) {
	csr := kd.generateCSR(kd.Certificate.Subject)

	var jsonStr = []byte(fmt.Sprintf("{\"csr\":\"%s\"}", base64.StdEncoding.EncodeToString([]byte(csr))))

	resp, _ := http.Post(kd.CsrURL, "application/json", bytes.NewBuffer(jsonStr))

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	bodyString := string(bodyBytes)

	if resp.StatusCode >= 200 && resp.StatusCode <= 299 {
		kd.saveCerts(bodyBytes, response, request)
	} else {
		fmt.Println("HTTP Response Status:", resp.StatusCode, http.StatusText(resp.StatusCode))
		fmt.Fprintf(response, bodyString)
	}

}
func (kd *kymaDetails) clearKymaInfo(response http.ResponseWriter, request *http.Request) {
	os.Remove(kd.AppPath + "/kyma/CaCrt.crt")
	os.Remove(kd.AppPath + "/kyma/ClientCrt.crt")
	os.Remove(kd.AppPath + "/kyma/kymaConnectDetails.json")
	os.Remove(kd.AppPath + "/kyma/TLSServerCrt.crt")
	os.Remove(kd.AppPath + "/kyma/TLSServerPrivateKey.key")
	os.Remove(kd.AppPath + "/kyma/SignedKymaCrt.crt")
	kd.KymaClientCrtExists = false
	kd.ResponseData = ""
	kd.goToIndex(response, request)
}

func (kd *kymaDetails) saveCerts(resp []byte, response http.ResponseWriter, request *http.Request) {

	csrRespData := &CSRConnectResponse{}
	unmarshalCertErr := json.Unmarshal([]byte(resp), csrRespData)
	if unmarshalCertErr != nil {
		log.Fatalf("could not parse csr request response: %s", unmarshalCertErr)
	}

	decodedCert, decodeErr := base64.StdEncoding.DecodeString(csrRespData.Crt)
	if decodeErr != nil {
		log.Fatalf("something went wrong decoding the crt")
	}

	decodedClientCrt, decodeErr := base64.StdEncoding.DecodeString(csrRespData.ClientCrt)
	if decodeErr != nil {
		log.Fatalf("something went wrong decoding the ClientCrt")
	}

	decodedCaCrt, decodeErr := base64.StdEncoding.DecodeString(csrRespData.CaCrt)
	if decodeErr != nil {
		log.Fatalf("something went wrong decoding the CaCrt")
	}

	csrRespData.Crt = string(decodedCert)
	csrRespData.ClientCrt = string(decodedClientCrt)
	csrRespData.CaCrt = string(decodedCaCrt)

	certBytes := []byte(csrRespData.Crt)
	errCert := ioutil.WriteFile(kd.AppPath+"/kyma/SignedKymaCrt.crt", certBytes, 0644)
	if errCert != nil {
		log.Fatalf("couldn't write kyma Crt cert: %s", errCert)
	}

	certBytes = []byte(csrRespData.ClientCrt)
	errCert = ioutil.WriteFile(kd.AppPath+"/kyma/ClientCrt.crt", certBytes, 0644)
	if errCert != nil {
		log.Fatalf("couldn't write kyma ClientCrt cert: %s", errCert)
	} else {
		kd.KymaClientCrtExists = true
	}

	certBytes = []byte(csrRespData.CaCrt)
	errCert = ioutil.WriteFile(kd.AppPath+"/kyma/CaCrt.crt", certBytes, 0644)
	if errCert != nil {
		log.Fatalf("couldn't write kyma CaCrt cert: %s", errCert)
	}

	kd.setTLSClient()
	kd.goToConnectedIndexPage(response, request)
}

//calls kyma metadata endpoint which provides..
//URL of the Application Registry API
//URL of the Event Service API
//certificate renewal URL used to rotate certificates
//certificate revocation URL used to revoke compromised certificates
//information uniquely identifying certificate
//information required to generate a CSR
func (kd *kymaDetails) getKymaMetedata(response http.ResponseWriter, request *http.Request) {

	// resp, _ := http.Post(kd.API.MetadataURL, "application/json", bytes.NewBuffer(jsonStr))

	resp, err := kd.HTTPTLSClient.Get(kd.API.MetadataURL)
	if err != nil {
		panic(err)
	}
	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	bodyString := string(bodyBytes)

	kd.ResponseData = bodyString
	kd.goToConnectedIndexPage(response, request)
}

func (kd *kymaDetails) sendAPIMetadata(response http.ResponseWriter, request *http.Request) {

	serverAPIJSON, err := ioutil.ReadFile(kd.AppPath + "/apis/api.json")
	if err != nil {
		log.Println("could not read serverAPI.json")
	}

	resp, _ := kd.HTTPTLSClient.Post(kd.API.MetadataURL, "application/json", bytes.NewBuffer(serverAPIJSON))

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	bodyString := string(bodyBytes)

	kd.ResponseData = bodyString
	kd.goToConnectedIndexPage(response, request)
}

func (kd *kymaDetails) setTLSClient() {
	srvCert, err := tls.LoadX509KeyPair(kd.AppPath+"/kyma/ClientCrt.crt", kd.AppPath+"/kyma/TLSServerPrivateKey.key")
	if err != nil {
		log.Fatal(err)
	}

	caCert, err := ioutil.ReadFile(kd.AppPath + "/kyma/ClientCrt.crt")
	if err != nil {
		log.Fatal(err)
	}

	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)

	kd.HTTPTLSClient = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{
				RootCAs:            caCertPool,
				Certificates:       []tls.Certificate{srvCert},
				InsecureSkipVerify: true,
			},
		},
	}
}

func (kd *kymaDetails) sendPetCreatedEvent(response http.ResponseWriter, request *http.Request) {

	eventMessage := map[string]interface{}{
		"event-type":         "petCreated",
		"event-type-version": "v1",
		"event-id":           "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
		"event-time":         "2019-09-26T15:00:00Z",
		"data": map[string]string{
			"id":       "4caad296-e0c5-491e-98ac-0ed118f9474e",
			"category": "mammal",
			"name":     "cat",
		},
	}

	eventBytes, _ := json.Marshal(eventMessage)

	resp, _ := kd.HTTPTLSClient.Post(kd.API.EventsURL, "application/json", bytes.NewBuffer(eventBytes))

	bodyBytes, _ := ioutil.ReadAll(resp.Body)
	bodyString := string(bodyBytes)

	// fmt.Println(response, bodyString)
	kd.ResponseData = bodyString

	kd.goToConnectedIndexPage(response, request)
}

func (kd *kymaDetails) setAppPaths() {
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		panic("No caller information")
	}

	kd.AppPath = path.Dir(filename)
}
