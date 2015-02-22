'use strict';
var util = require( 'util' );
var path = require( 'path' );
var yeoman = require( 'yeoman-generator' );
var chalk = require( 'chalk' );
var async = require( 'async' );


var ChildThemeGenerator = yeoman.generators.Base.extend( {
	init: function () {
		this.log( chalk.magenta( 'Thanks for generating with WP Make!' ) );

		this.on( 'end', function () {
			var i, length, installs = [],
				chalks = { skipped:[], run:[] },
				installers = [ 'npm', 'bower', 'composer' ];

			this.log( chalk.green.bold( 'Your child-theme has been generated.' ) );

			for ( i = 0, length = installers.length; i < length; i++ ) {
				if ( this.options['skip-install'] || this.options[ 'skip-' + installers[ i ] ] ) {
					chalks.skipped.push( chalk.yellow.bold( installers[ i ] + ' install' ) );
				} else {
					chalks.run.push( chalk.yellow.bold( installers[ i ] + ' install' ) );
					installs.push( _install( installers[ i ],this ) );
				}
			}
			
			if ( 0 < chalks.skipped.length ) {
				this.log( 'Skipping ' + chalks.skipped.join( ', ' ) + '. Just run yourself when you are ready.' );
			}
			if ( 0 < installs.length ) {
				this.log( 'Running ' + chalks.run.join( ', ' ) + ' for you. If this fails try running yourself.' );
				async.parallel( installs );
			}
		} );
	},

	options: function () {
		var done = this.async();
		this.basename = path.basename( this.env.cwd );

		var prompts = [
			{
				name:    'parentSlug',
				message: 'Parent Theme Slug',
			},
			{
				name:    'projectTitle',
				message: 'Theme name',
				default: 'WP Theme'
			},
			{
				name:    'funcPrefix',
				message: 'PHP function prefix ( lowercase letters and underscores only )',
				default: 'wptheme'
			},
			{
				name:    'description',
				message: 'Description',
				default: 'The best WordPress theme ever made!'
			},
			{
				name:    'projectHome',
				message: 'Theme homepage',
				default: 'http://wordpress.org/themes'
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
				type:    'confirm',
				name:    'sass',
				message: 'Use Sass?',
				default: true
			}
		];
		// gather initial settings
		this.prompt( prompts, function ( props ) {
			this.opts = props;
			this.fileSlug = this.opts.projectTitle.toLowerCase().replace( /[\s]/g, '-' ).replace( /[^a-z-_]/g, '' );
			this.namespace = this.fileSlug.replace( /-/g, '_' ).replace( /( ^|_ )( [a-z] )/g, function( match, group1, group2 ){
				return group1 + group2.toUpperCase(); 
			} );
			done();
		}.bind( this ) );
	},

	autoprefixer: function() {
		// If we're running Sass, automatically use autoprefixer.
		if ( this.opts.sass ) {
			this.opts.autoprefixer = true;
			return;
		}

		// See if we want to use it on it's own, but only if not using Sass.
		var done = this.async();
		this.prompt( [{
			type:    'confirm',
			name:    'autoprefixer',
			message: 'Use Autoprefixer?',
			default: true
		}],
		function( props ){
			this.opts.autoprefixer = props.autoprefixer;
			done();
		}.bind( this ) );
	},

	theme: function() {
		this.template( 'theme/_style.css', 'style.css' );
		this.template( 'theme/_functions.php', 'functions.php' );
		this.template( 'theme/_core.php', 'includes/functions/core.php' );
		this.template( 'theme/_humans.txt', 'humans.txt' );
		this.copy( 'theme/screenshot.png', 'screenshot.png' );
		this.copy( 'theme/readme-includes.md', 'includes/readme.md' );
	},

	i18n: function() {
		this.template( '../../shared/i18n/_language.pot', 'languages/' + this.opts.funcPrefix + '.pot' );
	},

	images: function() {
		this.copy( 'images/readme.md', 'images/readme.md' );
		this.copy( 'images/readme-sources.md', 'images/src/readme.md' );
	},

	js: function() {
		this.template( 'js/_script.js', 'assets/js/src/' + this.fileSlug + '.js' );
		this.copy( 'js/readme-vendor.md', 'assets/js/vendor/readme.md' );
	},

	css: function() {
		if ( this.opts.sass ) {
			this.template( 'css/_style.css', 'assets/css/sass/' + this.fileSlug + '.scss' );
		} else if ( this.opts.autoprefixer ) {
			this.template( 'css/_style.css', 'assets/css/src/' + this.fileSlug + '.css' );
		} else {
			this.template( 'css/_style.css', 'assets/css/' + this.fileSlug + '.css' );
		}
		this.copy( '../../shared/css/readme.md', 'assets/css/readme.md' );
	},

	tests: function() {
		//phpunit
		this.template( 'tests/phpunit/_Core_Tests.php', 'tests/phpunit/Core_Tests.php' );
		this.template( '../../shared/tests/phpunit/_TestCase.php', 'tests/phpunit/test-tools/TestCase.php' );
		this.template( '../../shared/tests/phpunit/_bootstrap.php', 'bootstrap.php.dist' );
		this.copy( '../../shared/tests/phpunit/phpunit.xml.dist', 'phpunit.xml.dist' );
		//qunit
		this.template( 'tests/qunit/_test.html', 'tests/qunit/' + this.fileSlug + '.html' );
		this.copy( 'tests/qunit/test.js', 'tests/qunit/tests/' + this.fileSlug + '.js' );
	},

	grunt: function() {
		this.template( 'grunt/_package.json', 'package.json' );
		this.template( 'grunt/_Gruntfile.js', 'Gruntfile.js' );
		this.copy( '../../shared/grunt/_jshintrc', '.jshintrc' );
	},

	bower: function() {
		this.template( '../../shared/bower/_bower.json', 'bower.json' );
		this.copy( '../../shared/bower/bowerrc', '.bowerrc' );
	},

	composer: function() {
		this.template( '../../shared/composer/_composer.json', 'composer.json' );
	},

	git: function() {
		this.copy( '../../shared/git/gitignore', '.gitignore' );
	}
} );

function _install( command, context ) {
	return function install( cb ) {
		context.emit( command + 'Install' );
		context.spawnCommand( command, ['install'] )
		.on( 'error', cb )
		.on( 'exit', context.emit.bind( context, command + 'Install:end' ) )
		.on( 'exit', function ( err ) {
			if ( err === 127 ) {
				this.log.error( 'Could not find Composer' );
			}
			cb( err );
		}.bind( context ) );
	}
}

module.exports = ChildThemeGenerator;