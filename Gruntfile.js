module.exports = function(grunt) {

    grunt.initConfig({
        // This line makes your node configurations available for use
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                camelcase: true,
                eqeqeq: true,
                indent: true,
                latedef: true,
                newcap: true,
                noempty: true,
                nonbsp: true,
                undef: true,
                eqnull: true,
                node: true,
                reporter: require('jshint-stylish')
            },
            // The paths tell JSHint which files to validate
            myFiles: ['*.js', 'config/**/*.js', 'controllers/**/*.js', 'models/**/*.js', 'routes/**/*.js']
        },
        // nodemon: {
        //     dev: {
        //         script: 'app.js',
        //         // options: {
        //         //     args: [],
        //         //     ignore: ['public/**', 'node_modules/**'],
        //         //     ext: 'js,html',
        //         //     nodeArgs: ['--debug'],
        //         //     delayTime: 1,
        //         //     cwd: __dirname
        //         // }
        //     }
        // },
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

    // grunt.registerTask('default', ['jshint', 'yuidoc', 'nodemon']);
    grunt.registerTask('default', ['jshint', 'yuidoc']);
};