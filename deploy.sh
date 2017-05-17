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

function usage() {
  echo "Usage: $0 [--install,--uninstall,--update,--installApi,--uninstallApi,--env]"
}

function install() {

  echo "Creating database..."
  # ignore "database already exists error"
  curl -s -X PUT $CLOUDANT_URL/$CLOUDANT_QUESTIONS_DATABASE | grep -v file_exists
  curl -s -X PUT $CLOUDANT_URL/$CLOUDANT_RATINGS_DATABASE | grep -v file_exists

  # echo "Inserting database design documents..."
  # # ignore "document already exists error"
  curl -s -X POST -H 'Content-Type: application/json' -d @ratings-designs.json $CLOUDANT_URL/$CLOUDANT_RATINGS_DATABASE/_bulk_docs | grep -v conflict

  echo "Creating $PACKAGE_NAME package"
  wsk package create $PACKAGE_NAME\
    -p services.cloudant.url $CLOUDANT_URL\
    -p services.cloudant.questions $CLOUDANT_QUESTIONS_DATABASE\
    -p services.cloudant.ratings $CLOUDANT_RATINGS_DATABASE\

  echo "Creating actions"
  wsk action create $PACKAGE_NAME/questionCreate\
    -a description 'Create a new question'\
    actions/question.create.js \
    --web true --annotation final true
  wsk action create $PACKAGE_NAME/questionRead\
    -a description 'Get a question'\
    actions/question.read.js \
    --web true --annotation final true
  wsk action create $PACKAGE_NAME/questionStats\
    -a description 'Get a question results'\
    actions/question.stats.js \
    --web true --annotation final true
  wsk action create $PACKAGE_NAME/ratingCreate\
    -a description 'Create a new rating'\
    actions/rating.create.js \
    --web true --annotation final true
}

function uninstall() {
  echo "Removing actions..."
  wsk action delete $PACKAGE_NAME/ratingCreate
  wsk action delete $PACKAGE_NAME/questionCreate
  wsk action delete $PACKAGE_NAME/questionRead
  wsk action delete $PACKAGE_NAME/questionStats

  echo "Removing package..."
  wsk package delete $PACKAGE_NAME

  echo "Done"
  wsk list
}

function update() {
  echo "Updating actions..."
  wsk action update $PACKAGE_NAME/questionCreate    actions/question.create.js
  wsk action update $PACKAGE_NAME/questionRead      actions/question.read.js
  wsk action update $PACKAGE_NAME/questionStats     actions/question.stats.js
  wsk action update $PACKAGE_NAME/ratingCreate      actions/rating.create.js
}

function showenv() {
  echo "PACKAGE_NAME=$PACKAGE_NAME"
  echo "CLOUDANT_URL=$CLOUDANT_URL"
  echo "CLOUDANT_QUESTIONS_DATABASE=$CLOUDANT_QUESTIONS_DATABASE"
  echo "CLOUDANT_RATINGS_DATABASE=$CLOUDANT_RATINGS_DATABASE"
}

function installApi() {
  wsk api create /emoting/1 /questions       PUT     emoting/questionCreate --response-type json
  wsk api create /emoting/1 /questions       GET     emoting/questionRead --response-type json

  wsk api create /emoting/1 /stats           GET     emoting/questionStats --response-type json

  wsk api create /emoting/1 /ratings         PUT     emoting/ratingCreate --response-type json
}

function uninstallApi() {
  wsk api delete /emoting/1
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
