# generics-grid

## Usage

```bash
cp .env.example .env
# start a websockets server at port 8080
npm run start
```

## Elastic Beanstalk deployment

1. Create an environment with the sample application: `eb create`
1. Set env variables on new environment: `eb setenv`
1. Deploy application to environment: `eb deploy`
