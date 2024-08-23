# Using lightweight alpine image
FROM python:3.10-alpine

# Installing packages
RUN apk update
RUN pip install --no-cache-dir pipenv

# Defining working directory and adding source code
WORKDIR /usr/src/app
COPY Pipfile bootstrap.sh ./

# Install API dependencies
RUN pipenv install --deploy --system

# Start app
EXPOSE 5000
ENTRYPOINT ["/usr/src/app/bootstrap.sh"]
