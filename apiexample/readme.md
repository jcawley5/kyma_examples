# API Example

Nodejs app that exposes an api for a mongo database.  Contains the following endpoints

Basic front end
```
http://localhost:3000
```

CRUD operations for orders...
```
http://localhost:3000/orders
```

Kubernetes health checks...
```
http://localhost:3000/health/liveness
http://localhost:3000/health/readiness
```

The mongodb url is configured in the dbConfig object of the config.json file

When running in docker use

```
"mongodb://host.docker.internal:27017/orders"
```

## Nodejs setup

`npm install`

`npm run start`


## Kyma setup

All commands assume the use of the namespace demo

Install mongo helm chart or use deploymentMongoDB.yaml

```
helm install --tls --name apiexampledb --set "persistence.size=1Gi" stable/mongodb --namespace demo
or
kubectl apply -f deploymentMongoDB.yaml -n demo
```

To install basic deployment with exposed API - adjust configmap dbConfig.url as needed
```
kubectl apply -f deploymentV1.yaml -n demo
```

To install version2 deployment - adjust configmap dbConfig.url as needed
```
kubectl apply -f deploymentV2.yaml -n demo
```

To install destination rule
```
kubectl apply -f destinationRule.yaml -n demo
```

Inspect virtual service
```
kubectl get virtualservices.networking.istio.io -n demo
kubectl describe virtualservices.networking.istio.io apiexample -n demo
```

Edit the virtualServicePatch files prior to patching to update value of `<cluster dns>` found in the hosts property - the namespace value of the destination host will also need updating if the namespace demo is not used


To destribute 60% of traffic to version 1
```
kubectl patch virtualservice apiexample --patch "$(cat virtualServicePatchV1.yaml)" -n demo --type=merge
```

Use a the header value x-app-version:v1 to show version 1 otherwise version 2 is shown.
```
kubectl patch virtualservice apiexample --patch "$(cat virtualServicePatchV2.yaml)" -n demo --type=merge
```