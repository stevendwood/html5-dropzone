var gulp = require('gulp'); 

// Include Our Plugins
var browserify = require("gulp-browserify");
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

// Lint Task
gulp.task('lint', function() {
    return gulp.src('src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// browserify & Minify JS
gulp.task('build', function() {
    gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(rename('dropzone.js'))
        .pipe(gulp.dest('./dist'));

   gulp.src('src/main.js')
        .pipe(browserify())
        .pipe(rename('dropzone.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

// Watch Files For Changes
gulp.task('watch', function() {
    gulp.watch('js/*.js', ['lint', 'build']);
});

// Default Task
gulp.task('default', ['lint', 'build', 'watch']);