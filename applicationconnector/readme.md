# Kyma Application Connection Example

This is a very minimial example without much error handling.  Example contains a server certificate and key to start a https server within the server directory.  All kyma related files will be saved within the kyma directory during runtime.

After cloning the repo run following commands in the applicationconnector folder

    git init -q
    go mod init https://github.com/jcawley5/kyma_examples/applicationconnector
    go build -o webapi
    go run .

Provide a one time token url from kyma application connector and submit request

Next use the "Create TLS Client Certificate" button to request the TLS Client Certificate

Next use the "Send API Metadata" button to submit the API spec

Within Kyma bind the application to a namespace and create a service instance of it.

Create a consumer of the event such as a lambda

Now the "Send Pet Created Event" button can be used
