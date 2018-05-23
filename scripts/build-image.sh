#!/usr/bin/env bash

LOCAL_TAG="generics-travel:$(git rev-parse --short HEAD)"
REMOTE_TAG="maxhallinan/$LOCAL_TAG"
docker build --tag $LOCAL_TAG .
docker tag $LOCAL_TAG $REMOTE_TAG
docker push $REMOTE_TAG
