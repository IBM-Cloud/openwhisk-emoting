#!/bin/bash
#
# Copyright 2017 IBM Corp. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the “License”);
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#  https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an “AS IS” BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# load configuration variables
source local.env
PACKAGE_NAME=emoting

if [ -z "$WSK" ]; then
  WSK=wsk
fi

function usage() {
  echo "Usage: $0 [--install,--uninstall,--update,--installApi,--uninstallApi,--env]"
}

function install() {

  echo "Creating database..."
  # ignore "database already exists error"
  curl -s -X PUT $CLOUDANT_URL/$CLOUDANT_QUESTIONS_DATABASE | grep -v file_exists
  curl -s -X PUT $CLOUDANT_URL/$CLOUDANT_RATINGS_DATABASE | grep -v file_exists
  curl -s -X PUT $CLOUDANT_URL/$CLOUDANT_SHORTCODES_DATABASE | grep -v file_exists

  # echo "Inserting database design documents..."
  # # ignore "document already exists error"
  curl -s -X POST -H 'Content-Type: application/json' -d @ratings-designs.json $CLOUDANT_URL/$CLOUDANT_RATINGS_DATABASE/_bulk_docs | grep -v conflict

  echo "Creating $PACKAGE_NAME package"
  $WSK package create $PACKAGE_NAME\
    -p services.cloudant.url $CLOUDANT_URL\
    -p services.cloudant.questions "$CLOUDANT_QUESTIONS_DATABASE"\
    -p services.cloudant.ratings "$CLOUDANT_RATINGS_DATABASE"\
    -p services.cloudant.shortcodes "$CLOUDANT_SHORTCODES_DATABASE"\
    -p services.nexmo.api_key "$NEXMO_API_KEY"\
    -p services.nexmo.api_secret "$NEXMO_API_SECRET"\
    -p services.nexmo.from "$NEXMO_FROM"\

  echo "Creating actions"
  $WSK action create $PACKAGE_NAME/questionCreate\
    -a description 'Create a new question'\
    actions/question.create.js \
    --kind nodejs:8 --web true --annotation final true
  $WSK action create $PACKAGE_NAME/questionRead\
    -a description 'Get a question'\
    actions/question.read.js \
    --kind nodejs:8 --web true --annotation final true
  $WSK action create $PACKAGE_NAME/questionStats\
    -a description 'Get a question results'\
    actions/question.stats.js \
    --kind nodejs:8 --web true --annotation final true
  $WSK action create $PACKAGE_NAME/questionShortcode\
    -a description 'Set a question SMS shortcode'\
    actions/question.shortcode.js \
    --kind nodejs:8 --web true --annotation final true

  $WSK action create $PACKAGE_NAME/ratingCreate\
    -a description 'Create a new rating'\
    actions/rating.create.js \
    --kind nodejs:8 --web true --annotation final true
  $WSK action create $PACKAGE_NAME/ratingByShortcode\
    -a description 'Handles the incoming SMS vote'\
    --kind nodejs:8 actions/rating.byshortcode.js
  $WSK action create $PACKAGE_NAME/ratingByNexmo\
    -a description 'Handles the NEXMO SMS vote'\
    --kind nodejs:8 actions/rating.nexmo.js

  $WSK action create $PACKAGE_NAME/ratingByShortcode-sequence \
    $PACKAGE_NAME/ratingByNexmo,$PACKAGE_NAME/ratingByShortcode,$PACKAGE_NAME/ratingCreate \
    --sequence \
    --web true --annotation final true
}

function uninstall() {
  echo "Removing actions..."
  $WSK action delete $PACKAGE_NAME/ratingByShortcode-sequence
  $WSK action delete $PACKAGE_NAME/ratingByNexmo
  $WSK action delete $PACKAGE_NAME/ratingByShortcode
  $WSK action delete $PACKAGE_NAME/ratingCreate
  $WSK action delete $PACKAGE_NAME/questionCreate
  $WSK action delete $PACKAGE_NAME/questionRead
  $WSK action delete $PACKAGE_NAME/questionStats
  $WSK action delete $PACKAGE_NAME/questionShortcode

  echo "Removing package..."
  $WSK package delete $PACKAGE_NAME

  echo "Done"
  $WSK list
}

function update() {
  echo "Updating actions..."
  $WSK action update $PACKAGE_NAME/questionCreate    --kind nodejs:8 actions/question.create.js
  $WSK action update $PACKAGE_NAME/questionRead      --kind nodejs:8 actions/question.read.js
  $WSK action update $PACKAGE_NAME/questionStats     --kind nodejs:8 actions/question.stats.js
  $WSK action update $PACKAGE_NAME/questionShortcode --kind nodejs:8 actions/question.shortcode.js
  $WSK action update $PACKAGE_NAME/ratingCreate      --kind nodejs:8 actions/rating.create.js
  $WSK action update $PACKAGE_NAME/ratingByShortcode --kind nodejs:8 actions/rating.byshortcode.js
  $WSK action update $PACKAGE_NAME/ratingByNexmo     --kind nodejs:8 actions/rating.nexmo.js
}

function showenv() {
  echo "PACKAGE_NAME=$PACKAGE_NAME"
  echo "CLOUDANT_URL=$CLOUDANT_URL"
  echo "CLOUDANT_QUESTIONS_DATABASE=$CLOUDANT_QUESTIONS_DATABASE"
  echo "CLOUDANT_RATINGS_DATABASE=$CLOUDANT_RATINGS_DATABASE"
}

function installApi() {
  $WSK api create /emoting/1 /questions           PUT     $PACKAGE_NAME/questionCreate --response-type json
  $WSK api create /emoting/1 /questions           GET     $PACKAGE_NAME/questionRead --response-type json
  $WSK api create /emoting/1 /questions/shortcode POST    $PACKAGE_NAME/questionShortcode --response-type json

  $WSK api create /emoting/1 /stats               GET     $PACKAGE_NAME/questionStats --response-type json

  $WSK api create /emoting/1 /ratings             PUT     $PACKAGE_NAME/ratingCreate --response-type json
  $WSK api create /emoting/1 /ratings/nexmo       POST    $PACKAGE_NAME/ratingByShortcode-sequence  --response-type json
  $WSK api create /emoting/1 /ratings/nexmo       GET    $PACKAGE_NAME/ratingByShortcode-sequence  --response-type json
}

function uninstallApi() {
  $WSK api delete /emoting/1
}

function recycle() {
  uninstallApi
  uninstall
  install
  installApi
}

case "$1" in
"--install" )
install
;;
"--uninstall" )
uninstall
;;
"--update" )
update
;;
"--env" )
showenv
;;
"--installApi" )
installApi
;;
"--uninstallApi" )
uninstallApi
;;
"--recycle" )
recycle
;;
* )
usage
;;
esac
