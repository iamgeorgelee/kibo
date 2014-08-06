module.exports = function(grunt) {

    grunt.initConfig({
        // This line makes your node configurations available for use
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                eqeqeq: true,
                indent: true,
                latedef: true,
                newcap: true,
                noempty: true,
                nonbsp: true,
                undef: true,
                eqnull: true,
                expr: true,
                node: true,
                reporter: require('jshint-stylish')
            },
            // The paths tell JSHint which files to validate
            myFiles: ['*.js', 'config/**/*.js', 'controllers/**/*.js', 'models/**/*.js', 'routes/**/*.js']
        },
        yuidoc: {
            compile: {
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>',
                version: '<%= pkg.version %>',
                url: '<%= pkg.homepage %>',
                options: {
                    paths: '.',
                    linkNatives: 'true',
                    outdir: './public/docs'
                }
            }
        }
    });
    // Each plugin must be loaded following this pattern
    grunt.loadNpmTasks('grunt-contrib-jshint');
    // grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-contrib-yuidoc');

    grunt.registerTask('heroku:production', ['jshint', 'yuidoc']);
    grunt.registerTask('default', ['jshint', 'yuidoc']);
};