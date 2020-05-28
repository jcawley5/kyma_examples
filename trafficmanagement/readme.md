## Canary Deployment Example

Create the namespace **canary**

Apply deploymentV1 into canary namespace - this will generate a deployment, service and api.

  ```
 kubectl apply -f deploymentV1.yaml -n canary
```

Verify API works using URL - version is indicated within grey box
- https://canary-deployment-example. &lt; cluster dns &gt;

Deploy destinationRules
  ```
 kubectl apply -f destinationRule.yaml -n  canary
```

Inspect virtual service
   ```
kubectl get virtualservices.networking.istio.io -n canary
kubectl describe virtualservices.networking.istio.io canary-deployment-example -n canary
```
Patch the Virtual Service to include weight value to keep all traffic on DeploymentV1.  Edit the file prior to patching to update value of `<cluster dns>` found in the hosts property - the namespace value of the destination host will also need updating if the namespace canary is not used
```
kubectl patch virtualservice canary-deployment-example --patch "$(cat virtualServicePatchV1.yaml)" -n canary --type=merge
```

Verify API is still working correctly
- https://canary-deployment-example. &lt; domain &gt;

Deployment version2 of microserice
  ```
 kubectl apply -f deploymentV2.yaml -n canary
```

Verify all API traffic is staying on V1 of microservice
- https://canary-deployment-example. &lt; domain &gt;

Apply Patch 2 of Virtual Service which will distribute 10 percent of traffic onto DeploymentV2.  Edit the file prior to patching to update value of `<cluster dns>` found in the hosts property - the namespace value of the destination host will also need updating if the namespace canary is not used
```
kubectl patch virtualservice canary-deployment-example --patch "$(cat virtualServicePatchV2.yaml)" -n canary --type=merge
```

Verify API works correctly with ~10 percent of the time showing version 2
- https://canary-deployment-example. &lt; domain &gt;

Apply Patch 3 of Virtual Service which will distribute all traffic onto DeploymentV2 unless the request contains the header `x-app-version: v1` which will send it to the version 1 deployemnt.  Edit the file prior to patching to update value of `<cluster dns>` found in the hosts property - the namespace value of the destination host will also need updating if the namespace canary is not used

```
kubectl patch virtualservice canary-deployment-example --patch "$(cat virtualServicePatchV3.yaml)" -n canary --type=merge
```
