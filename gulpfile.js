var gulp = require('gulp');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var minify = require('gulp-minify');
var uglify = require("gulp-uglify");
var concat = require('gulp-concat');
var babel = require('gulp-babel');
var es6transpiler = require('gulp-es6-transpiler');

gulp.task("scripts", function() {
  return gulp.src([ 'public/js/app.js' ]).pipe(babel({ presets: ['es2015'] })).pipe(gulp.dest("public/dist"));
});

gulp.task("watch", function() {
    gulp.watch("./public/js/*.js", ["scripts"]);
});

gulp.task('default', [ 'scripts' ]);
