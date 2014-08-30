#kibo


##Getting Start


###Locations
* [Production Version](https://kibo.herokuapp.com/)
Ignore the landing page. Web version will no longer be updated.
* [Herokuapp log](https://addons-sso.heroku.com/apps/kibo/addons/papertrail:choklad)
* [API Doc](https://kibo.herokuapp.com/docs)


###API Call Example
http://[Host]/api/[method]
```
https://kibo.herokuapp.com/api/localLogin
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

* HTTP status code
* User preference only yes or no, not -1, 0, 1
* Able to create user defined event: choose restaurant from recommendation, pick friends, send notification, user receive invite and accept/reject. Voting.
* Error message should return with HTTP status code
* Move facebook App secret to DB
* [bug] Not handling facebook paging
* [bug] All id should use object id?
* API proteced with OAuth 2
    * http://thewayofcode.wordpress.com/2013/11/25/how-to-secure-your-http-api-endpoints-using-facebook-as-oauth-provider/
    * http://coderead.wordpress.com/2012/08/16/securing-node-js-restful-services-with-jwt-tokens/
    * http://www.sitepoint.com/using-json-web-tokens-node-js/
    * https://github.com/hokaccha/node-jwt-simple
    * https://docs.auth0.com/nodejs-tutorial


###Lower Priority

* rewrite authenticate and move passport.js
* local signup - verify password strong or not
* async.series should rewrite with async.waterfall? Some maybe
* Get all restaurant (for search)
* Mocha - Unit Test
    * [Grunt Mocha Plugin](https://github.com/pghalliday/grunt-mocha-test)
    * [User Mocha to test your RestAPI](http://thewayofcode.wordpress.com/2013/04/21/how-to-build-and-test-rest-api-with-nodejs-express-mocha/)
* Security Scan
    * Dynamic Code Analysis(Fuzz in run time), Static Code Analysis(Scan code for security vulnerability)
* Uglify


[CheatSheet for writing README.md](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)