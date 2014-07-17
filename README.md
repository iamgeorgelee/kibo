#kibo


##Getting Start


###Locations
* [Production Version](http://kibo.herokuapp.com/)
Ignore the landing page. Web version will no longer be updated.
* [API Doc](http://kibo.herokuapp.com/docs)


###API Call Example
http://[Host]/api/[method]
```
http://kibo.herokuapp.com/api/localLogin
```
Send with username and password


###Before Build
Please remember to lint your code and build documentation.
Simply just type this in command line:
```
grunt
```

####Grunt
Grunt is a multi-tasker, it can do multi tasks in just one command. Tasks are all describe in **Gruntfile.js**
Currently we do:
* jshint - Check styling and basic errors
* yuidoc - Generate documents. Can access from **https://HOST/docs**

###Before Push
* Use JS Beautifier
* Comment with YUIDoc syntaxs
    * [YUIDoc Syntax](http://yui.github.io/yuidoc/syntax/index.html)
    * [More explaination about YUIDoc](http://code.tutsplus.com/tutorials/documenting-javascript-with-yuidoc--net-25324)

##TODO

###Higher Priority

* User Preference
* Restaurant - Send event location and participant id, return list of restaurants
* Able to create user defined event: choose restaurant from recommendation, pick friends, send notification, user receive invite and accept/reject. No voting. [7/20]
* middle check point + voting [8/3]
* Move facebook App secret to DB
* [bug] Not handling facebook paging
* [bug] All id should use object id?


###Lower Priority

* async.series should rewrite with async.waterfall? Some maybe
* Mocha - Unit Test
    * [Grunt Mocha Plugin](https://github.com/pghalliday/grunt-mocha-test)
    * [User Mocha to test your RestAPI](http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/)
* Security Scan
    * Dynamic Code Analysis(Fuzz in run time), Static Code Analysis(Scan code for security vulnerability)
* SSL
    * Heroku by default is without SSL
* Uglify


[CheatSheet for writing README.md](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)