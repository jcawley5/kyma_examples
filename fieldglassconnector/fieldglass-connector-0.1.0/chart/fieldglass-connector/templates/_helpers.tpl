{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
*/}}
{{- define "bundle.fullname" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "basicAuthHeader" }}
{{- printf "{\"Basic\": \"%s\" }" (printf "%s:%s" .Values.basic_user .Values.basic_password | b64enc) }}
{{- end }}



    

