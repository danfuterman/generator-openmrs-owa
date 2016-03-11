/**
 * The contents of this file are subject to the OpenMRS Public License
 * Version 1.0 (the "License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://license.openmrs.org
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations
 * under the License.
 * Copyright (C) OpenMRS, LLC.  All Rights Reserved.
 */
// generated on <%= date %> using <%= name %> <%= version %>
'use strict';

var fs = require('fs');
var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var del = require('del');
var mainBowerFiles = require('main-bower-files');
var wiredep = require('wiredep').stream;
var gutil = require('gulp-util');
var browserSync = require('browser-sync').create();

var plugins = gulpLoadPlugins();

var THIS_APP_ID = '<%= appId %>';

var htmlGlob = ['app/**/*.html'];
var resourcesGlob = ['app/**/*.{png,svg,jpg,gif}', 'app/**/*.{css,less}',
  'app/**/*.js', 'app/manifest.webapp', /* list extra resources here */ ];

var getConfig = function () {
  var config;

  try {
    // look for config file
    config = require('./config.json');
  } catch (err) {
    // create file with defaults if not found
    config = {
      'LOCAL_OWA_FOLDER': '<%= localDeployDirectory %>',
      'APP_ENTRY_POINT': '<%= appEntryPoint %>'
    };

    fs.writeFile('config.json', JSON.stringify(config), function(err) {
    if(err) {
        return gutil.log(err);
    }
      gutil.log("Default config file created");
    });

  } finally {
    return config;
  }
}

gulp.task('copy-bower-packages', function() {
  try {
    fs.statSync('bower_components');

    return gulp.src(mainBowerFiles(), {
      base: 'bower_components'
    }).pipe(gulp.dest('dist/lib'));
  } catch (err) {
    // Don't panic
  }
});

gulp.task('html', ['copy-bower-packages'], function() {
  try {
    fs.statSync('bower_components');

    // User wiredep to automagically link bower packages
    return gulp.src(htmlGlob).pipe(wiredep({
      ignorePath: '../bower_components/',
      fileTypes: {
        html: {
          replace: {
            js: '<script src="lib/{{filePath}}"></script>',
            css: '<link rel="stylesheet" href="lib/{{filePath}}" />'
          }
        }
      }
    })).pipe(gulp.dest('dist'));
  } catch (err) {
    return gulp.src(htmlGlob)
      .pipe(gulp.dest('dist'));
  }
});

gulp.task('resources', function() {
  return gulp.src(resourcesGlob)
    .pipe(gulp.dest('dist'));
});

gulp.task('browser-sync-inject-css', ['deploy-local'], function() {
  return gulp.src('app/**/*.css').pipe(browserSync.stream());
});

gulp.task('browser-sync-reload', ['deploy-local'], function() {
  return browserSync.reload();
});

gulp.task('watch', function() {
  // forget about all the error checking for now
  var config = require('./config.json');

  browserSync.init({
    proxy: {
      target: config.APP_ENTRY_POINT
    }
  });

  gulp.watch('app/**/*.css', ['browser-sync-inject-css']);
  gulp.watch('app/**/*.{js,html}', ['browser-sync-reload']); // reload on JS or HTML changes
});

gulp.task('deploy-local', ['build'], function() {
  var config = getConfig();

  return gulp.src(['dist/**/*', '!*.zip'])
    .pipe(gulp.dest(config.LOCAL_OWA_FOLDER + THIS_APP_ID));
});

gulp.task('build', ['resources', 'html'], function() {
  return gulp.src('dist/**/*')
    .pipe(plugins.zip(THIS_APP_ID + '.zip'))
    .pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['dist']));

gulp.task('default', ['clean'], function() {
  gulp.start('build');
});
