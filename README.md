#kibo


##Getting Start


###How To Run
Simply just type this in command line:
```
grunt
```

###Grunt
Grunt is a multi-tasker, it can do multi tasks in just one command. Tasks are all describe in **Gruntfile.js**
Currently we do:
* jshint - Check styling and basic errors
* yuidoc - Generate documents. Can access from **https://HOST/docs**
* nodemon - Run **node app.js**

###File Structure

###Before Push
* Use Beautifier. Cloud9 Edit -> Code Formatting
* Comment with YUIDoc syntaxs.

[YUIDoc Syntax](http://yui.github.io/yuidoc/syntax/index.html)

[More explaination about YUIDoc](http://code.tutsplus.com/tutorials/documenting-javascript-with-yuidoc--net-25324)


##TODO

###Higher Priority

###Lower Priority

####Mocha - Unit Test

[Grunt Mocha Plugin](https://github.com/pghalliday/grunt-mocha-test)

[User Mocha to so test with your RestAPI](http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/)

####Security Scan
Dynamic Code Analysis(Fuzz in run time), Static Code Analysis(Scan code for security vulnerability)

####SSL
Heroku by default is without SSL


##Known Issue
* [Web Page] [Ignore for now] When the User Collection is totally empty, link to Facebook work correctly in DB but may not display in EJS.
* Needs to set develop version and production version. **NODE_ENV = develop**
* When deploy to Heroku, needs to change Facebook authentication callback to fit Heroku domain name. Use 'environment' to choose.
 

[CheatSheet for writing README.md](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)