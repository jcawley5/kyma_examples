## Provision Commerce - Use mock and then create app binding

Addons
https://github.com/kyma-project/addons/releases/download/0.7.0/index-testing.yaml
git::https://github.com/kyma-incubator/github-slack-connectors.git//addons/index.yaml
git::https://github.com/jcawley5/xf-addons.git//addons/index.yaml

Provision Commerce Mock in Namespace

Create app and connect commerce - connects events and commerce webservices
Create service instances for both

## Provision Redis - use helm chart

Provision Redis

## Provision Slack\

Provision Slack
Bot Token: https://api.slack.com/apps/ATYDJSKS6/oauth?
Slack Signed Secret: https://api.slack.com/apps/ATYDJSKS6/general?
Workspace: JC

Add service instance

Configure webhook endpoint in Slack
https://api.slack.com/apps/ATYDJSKS6/event-subscriptions?

Should be somethink like
https://slack-connector-jc.jctest.cluster.extend.cx.cloud.sap/webhook

## Install Redis Commander - set secret first

Goto the Redis Service instance, choose Credentials and generate credential
Copy credential name and replace secret name in redis-commander deployment

## Setup Lambdas
