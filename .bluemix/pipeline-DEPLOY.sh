#!/bin/bash

################################################################
# Install dependencies
################################################################

echo 'Installing dependencies...'
sudo apt-get -qq update 1>/dev/null
sudo apt-get -qq install jq 1>/dev/null
sudo apt-get -qq install figlet 1>/dev/null

figlet 'Node.js'

echo 'Installing nvm (Node.js Version Manager)...'
npm config delete prefix
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.2/install.sh | bash > /dev/null 2>&1
. ~/.nvm/nvm.sh

echo 'Installing Node.js 6.9.1...'
nvm install 6.9.1 1>/dev/null
npm install --progress false --loglevel error 1>/dev/null

figlet 'OpenWhisk CLI'
mkdir ~/wsk
curl https://openwhisk.ng.bluemix.net/cli/go/download/linux/amd64/wsk > ~/wsk/wsk
chmod +x ~/wsk/wsk
export PATH=$PATH:~/wsk

################################################################
# Create services
################################################################
figlet 'Services'

# Create Cloudant service
figlet -f small 'Cloudant'
cf create-service cloudantNoSQLDB Lite cloudant-for-emoting
cf create-service-key cloudant-for-emoting for-emoting

CLOUDANT_CREDENTIALS=`cf service-key cloudant-for-emoting for-emoting | tail -n +2`
export CLOUDANT_URL=`echo $CLOUDANT_CREDENTIALS | jq -r .url`

if [ -z "$CLOUDANT_QUESTIONS_DATABASE" ]; then
  export CLOUDANT_QUESTIONS_DATABASE=questions
fi

if [ -z "$CLOUDANT_RATINGS_DATABASE" ]; then
  export CLOUDANT_RATINGS_DATABASE=ratings
fi

if [ -z "$CLOUDANT_SHORTCODES_DATABASE" ]; then
  export CLOUDANT_SHORTCODES_DATABASE=shortcodes
fi

################################################################
# OpenWhisk artifacts
################################################################
figlet 'OpenWhisk'

echo 'Retrieving OpenWhisk authorization key...'

# Retrieve the OpenWhisk authorization key
CF_ACCESS_TOKEN=`cat ~/.cf/config.json | jq -r .AccessToken | awk '{print $2}'`

# Docker image should be set by the pipeline, use a default if not set
if [ -z "$OPENWHISK_API_HOST" ]; then
  echo 'OPENWHISK_API_HOST was not set in the pipeline. Using default value.'
  export OPENWHISK_API_HOST=openwhisk.ng.bluemix.net
fi
OPENWHISK_KEYS=`curl -XPOST -k -d "{ \"accessToken\" : \"$CF_ACCESS_TOKEN\", \"refreshToken\" : \"$CF_ACCESS_TOKEN\" }" \
  -H 'Content-Type:application/json' https://$OPENWHISK_API_HOST/bluemix/v2/authenticate`

SPACE_KEY=`echo $OPENWHISK_KEYS | jq -r '.namespaces[] | select(.name == "'$CF_ORG'_'$CF_SPACE'") | .key'`
SPACE_UUID=`echo $OPENWHISK_KEYS | jq -r '.namespaces[] | select(.name == "'$CF_ORG'_'$CF_SPACE'") | .uuid'`
OPENWHISK_AUTH=$SPACE_UUID:$SPACE_KEY

# Configure the OpenWhisk CLI
wsk property set --apihost $OPENWHISK_API_HOST --auth "${OPENWHISK_AUTH}"

# To enable the creation of API in Bluemix, inject the CF token in the wsk properties
echo "APIGW_ACCESS_TOKEN=${CF_ACCESS_TOKEN}" >> ~/.wskprops

# Deploy the actions
figlet -f small 'Uninstall'
./deploy.sh --uninstallApi || true
./deploy.sh --uninstall || true
figlet -f small 'Install'
./deploy.sh --install
./deploy.sh --installApi
