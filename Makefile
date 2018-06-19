build-image:
  ./scripts/build-image.sh

k8s-configure:
  kubectl create configmap generics-travel \
    --from-env-file=.env

k8s-create:
  kubectl apply -f kubernetes/
