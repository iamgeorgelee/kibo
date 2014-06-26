kibo
====

1. Use YUIDoc to generate JS API Document. YUIDoc does not support TODO tag yet, use @attribute temporary. To run: yuidoc -c yuidoc.json
2. Do JSLint (/*jslint node: true, eqeq: false, nomen: true, sloppy: true, white: true */)

Known issue:
1. [Web Page] [Ignore for now] When the User Collection is totally empty, link to Facebook work correctly in DB but may not display in EJS.
2. **Staging version has problem (Should change to just one FB app)
3. Need to use grunt to do multi tasks at once. yuidoc, jshint