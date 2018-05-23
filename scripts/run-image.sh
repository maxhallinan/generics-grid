source .env
docker run \
  --env-file .env \
  --expose $WS_PORT \
  --publish $WS_PORT:8080 \
  generics-travel
