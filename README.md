#kibo


##Getting Start

Simply just type this in command line:

```
grunt
```

###Grunt

Grunt is a multi-tasker, it can do multi tasks in just one command. Tasks are all describe in Grintfile.js
Currently we do:
1. jshint - Check styling and basic errors
2. yuidoc - Generate documents. Can access from "https://HOST/docs"
3. nodemon - Run "node app.js"

###File Structure

###When Coding
Use Beautifier. Cloud9 Edit -> Code Formatting

##Road To Being Robust - What we need to do in future

###Mocha - Unit Test
https://github.com/pghalliday/grunt-mocha-test
http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/

###Security Scan - Dynamic Code Analysis(Fuzz in run time), Static Code Analysis(Scan code for security vulnerability)

###SSL
Heroku by default is without SSL

##Known Issue
1. [Web Page] [Ignore for now] When the User Collection is totally empty, link to Facebook work correctly in DB but may not display in EJS.
2. Needs to set develop version and production version. "NODE_ENV = develop"
3. When deploy to Heroku, needs to change Facebook authentication callback to fit Heroku domain name. Use 'environment' to choose.