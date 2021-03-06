'use strict';
var util = require( 'util' );
var path = require( 'path' );
var yeoman = require( 'yeoman-generator' );
var chalk = require( 'chalk' );
var async = require( 'async' );

var LibGenerator = yeoman.generators.Base.extend({
		init: function() {
			this.log( chalk.magenta( 'Thanks for generating with WP Make!' ) );

			this.on( 'end', function() {
				var i, length, installs = [],
					chalks = { skipped:[], run:[] },
					installers = ['npm', 'bower', 'composer'];

				this.log( chalk.green.bold( 'Your library has been generated.' ));

				for ( i = 0, length = installers.length; i < length; i++ ) {
					if ( this.options['skip-install'] || this.options[ 'skip-' + installers[ i ] ] ) {
						chalks.skipped.push( chalk.yellow.bold( installers[ i ] + ' install' ));
					} else {
						chalks.run.push( chalk.yellow.bold( installers[ i ] + ' install' ));
						installs.push( _install( installers[ i ],this ));
					}
				}

				if ( 0 < chalks.skipped.length ) {
					this.log( 'Skipping ' + chalks.skipped.join( ', ' ) + '. Just run yourself when you are ready.' );
				}
				if ( 0 < installs.length ) {
					this.log( 'Running ' + chalks.run.join( ', ' ) + ' for you. If this fails try running yourself.' );
					async.parallel( installs );
				}
			});
		},

		options: function() {
			var done = this.async();
			this.basename = path.basename( this.env.cwd );

			var prompts = [
				{
					name:    'projectTitle',
					message: 'Project Title',
					default: 'WP Library'
				},
				{
					name:    'description',
					message: 'Description',
					default: 'The best WordPress extension ever made!'
				},
				{
					name:    'projectHome',
					message: 'Project homepage'
				},
				{
					name:    'authorName',
					message: 'Author name',
					default: this.user.git.name
				},
				{
					name:    'authorEmail',
					message: 'Author email',
					default: this.user.git.email
				},
				{
					name:    'authorUrl',
					message: 'Author URL'
				},
				{
					name:    'gitUser',
					message: 'GitHub Account Name',
					default: this.user.git.username
				}
			];

			// Gather initial settings
			this.prompt( prompts, function( properties ) {
				this.opts = properties;

				this.opts.projectSlug = this.opts.projectTitle.toLowerCase().replace( /[\s]/g, '-' ).replace( /[^a-z-_]/g, '' );
				this.fileSlug = this.opts.projectSlug;
				this.namespace = this.opts.projectTitle.replace( /[\s|-]/g, '_' ).replace( /( ^|_ )( [a-z] )/g, function( match, group1, group2 ){
					return group1 + group2.toUpperCase();
				});

				done();
			}.bind( this ) );
		},

		grunt: function() {
			this.template( 'grunt/_package.json', 'package.json' );
			this.template( '../../shared/grunt/_Gruntfile.js', 'Gruntfile.js' );
			this.copy( '../../shared/grunt/_jshintrc', '.jshintrc' );
			this.copy( '../../shared/grunt/tasks/_template.js', 'tasks/_template.js');
			this.copy( '../../shared/grunt/tasks/options/_template.js', 'tasks/options/_template.js');
			this.template( '../../shared/grunt/tasks/options/_cssmin.js', 'tasks/options/cssmin.js' );
			this.template( '../../shared/grunt/tasks/options/_clean.js', 'tasks/options/clean.js' );
			this.template( '../../shared/grunt/tasks/options/_compress.js', 'tasks/options/compress.js' );
			this.template( '../../shared/grunt/tasks/options/_concat.js', 'tasks/options/concat.js' );
			this.template( '../../shared/grunt/tasks/options/_copy.js', 'tasks/options/copy.js' );
			this.template( '../../shared/grunt/tasks/options/_jshint.js', 'tasks/options/jshint.js' );
			this.template( '../../shared/grunt/tasks/options/_phpunit.js', 'tasks/options/phpunit.js' );
			this.template( '../../shared/grunt/tasks/options/_qunit.js', 'tasks/options/qunit.js' );
			this.template( '../../shared/grunt/tasks/options/_uglify.js', 'tasks/options/uglify.js' );
			this.template( '../../shared/grunt/tasks/options/_watch.js', 'tasks/options/watch.js' );
			this.template( '../../shared/grunt/tasks/_build.js', 'tasks/build.js' );
			this.template( '../../shared/grunt/tasks/_css.js', 'tasks/css.js' );
			this.template( '../../shared/grunt/tasks/_default.js', 'tasks/default.js' );
			this.template( '../../shared/grunt/tasks/_js.js', 'tasks/js.js' );
			this.template( '../../shared/grunt/tasks/_test.js', 'tasks/test.js' );
		},

		bower: function() {
			this.template( '../../shared/bower/_bower.json', 'bower.json' );
			this.copy( '../../shared/bower/bowerrc', '.bowerrc' );
		},

		composer: function() {
			this.template( 'composer/_composer.json', 'composer.json' );
		},

		git: function() {
			this.copy( '../../shared/git/gitignore', '.gitignore' );
		},

		tests: function() {
			//phpunit
			this.template( '../../shared/tests/phpunit/_TestCase.php', 'tests/phpunit/test-tools/TestCase.php' );
			this.template( 'tests/phpunit/_bootstrap.php', 'bootstrap.php.dist' );
			this.copy( 'tests/phpunit/phpunit.xml.dist', 'phpunit.xml.dist' );
			//qunit
			this.template( '../../shared/tests/qunit/_test.html', 'tests/qunit/' + this.fileSlug + '.html' );
			this.copy( '../../shared/tests/qunit/test.js', 'tests/qunit/tests/' + this.fileSlug + '.js' );
		},

		library: function() {
			this.template( 'library/_app.php', this.fileSlug + '.php' );
			this.copy( 'library/_LICENSE.md', 'LICENSE.md' );
			this.template( 'library/_README.md', 'README.md' );
			this.copy( '../../shared/theme/readme-includes.md', 'includes/readme.md' );
		}
	}
);

/**
 * Install dependencies
 *
 * @param {string} command
 * @param {object} context
 *
 * @returns {Function}
 *
 * @private
 */
function _install( command, context ) {
	return function install( cb ) {
		context.emit( command + 'Install' );
		context.spawnCommand( command, ['install'] )
			.on( 'error', cb )
			.on( 'exit', context.emit.bind( context, command + 'Install:end' ))
			.on( 'exit', function ( err ) {
				     if ( err === 127 ) {
					     this.log.error( 'Could not find Composer' );
				     }
				     cb( err );
			     }.bind( context ));
	}
}

// Export the module
module.exports = LibGenerator;
