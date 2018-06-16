#!/usr/bin/env bash

source .env

docker run \
  --env-file .env \
  --expose $WS_PORT \
  --publish $HOST_PORT:$WS_PORT \
  maxhallinan/generics-travel
