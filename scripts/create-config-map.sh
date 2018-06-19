#!/usr/bin/env bash
kubectl create configmap generics-travel \
  --from-env-file=.env
