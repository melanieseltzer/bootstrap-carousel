var gulp = require('gulp');
var autoprefixer = require('autoprefixer');
var babel = require('gulp-babel');
var browserify = require('browserify');
var browsersync = require('browser-sync').create();
var buffer = require('vinyl-buffer');
var cleancss = require('gulp-clean-css');
var del = require('del');
var deploy = require('gulp-gh-pages');
var gulpif = require('gulp-if');
var gzip = require('gulp-gzip');
var htmlbeautify = require('gulp-html-beautify');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var plumber = require('gulp-plumber');
var postcss = require('gulp-postcss');
var pug = require('gulp-pug');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify-es').default;

/* ------------------------- *
 *          PATHS
 * ------------------------- */

// Set your file paths here, modify depending on your workflow/naming
var paths = {
  vendor: {
    css: [
      './node_modules/normalize.css',
      './node_modules/bootstrap/dist/css'
    ],
    js: [
      './node_modules/jquery/dist',
      './node_modules/popper.js/dist/umd',
      './node_modules/bootstrap/dist/js',
      './node_modules/hammerjs'
    ]
  },
  assets: {
    src: 'src/assets/**/*',
    tmp: 'tmp/assets',
    dist: 'dist/assets'
  },
  js: {
    src: 'src/js/**/*.js',
    tmp: 'tmp/js',
    dist: 'dist/js'
  },
  styles: {
    src: 'src/styles/**/*.{css,scss,sass}',
    tmp: 'tmp/css',
    dist: 'dist/css'
  },
  views: {
    src: 'src/views/**/*.pug',
    _src: 'src/views/**/!(_)*.pug'
  },
  html: {
    src: 'tmp/**/*.html'
  },
  src: 'src',
  tmp: 'tmp',
  dist: 'dist'
};

/* ------------------------- *
 *         CLEANUP
 * ------------------------- */

gulp.task('clean:tmp', function () {
  return del([
    'tmp'
  ]);
});

gulp.task('clean:dist', function () {
  return del([
    'dist'
  ]);
});

// Delete tmp and dist folder for easy cleanup
gulp.task('clean', ['clean:tmp', 'clean:dist']);

/* ------------------------- *
 *     LOCAL DEVELOPMENT
 * ------------------------- */

// Compile to CSS for dev server
gulp.task('tmp:sass', function(){
  return gulp.src(paths.styles.src)
    .pipe(plumber())
		.pipe(sourcemaps.init())
    .pipe(sass({
      // Vendor files
      includePaths: paths.vendor.css
    }))
    .pipe(postcss([ autoprefixer() ]))
		.pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.tmp))
    .pipe(browsersync.stream());
});

// Transpile Js
gulp.task('tmp:js', function () {
  var b = browserify({
    entries: './src/js/all.js',
    debug: true,
    paths: paths.vendor.js
  });

  return b.bundle()
    .pipe(plumber())
    .pipe(source('all.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(babel({
        compact: false,
        presets: ['env']
      }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.js.tmp));
});

// Compile to HTML
gulp.task('tmp:pug', function(){
  return gulp.src(paths.views._src)
    .pipe(plumber())
    .pipe(pug())
    .pipe(htmlbeautify({indent_size: 2}))
    .pipe(gulp.dest(paths.tmp))
    .pipe(browsersync.stream());
});

// Copy asset files to tmp
gulp.task('copy', function() {
  return gulp.src(paths.assets.src)
    .pipe(gulp.dest(paths.assets.tmp));
});

// Start server and watch for changes
gulp.task('serve', ['copy', 'tmp:sass', 'tmp:js', 'tmp:pug'], function() {
  browsersync.init({
    server: paths.tmp
  });
  gulp.watch(paths.styles.src, ['tmp:sass']);
  gulp.watch(paths.views.src, ['tmp:pug']);
  gulp.watch(paths.js.src, ['tmp:js']);
  gulp.watch(paths.tmp + '/**/*').on('change', browsersync.reload);
});

/* ------------------------- *
 *     PRODUCTION BUILD
 * ------------------------- */

// Copy asset files to dist
// Also compress images
gulp.task('copy:compress', function() {
  return gulp.src(paths.assets.src)
    .pipe(imagemin({verbose: true}))
    .pipe(gulp.dest(paths.assets.dist));
});

// Compile to CSS for production
gulp.task('prod:css', function () {
  return gulp.src(paths.styles.src)
    .pipe(plumber())
    .pipe(sass({
      // Vendor files
      includePaths: paths.vendor.css
    }))
    .pipe(postcss([ autoprefixer() ]))
   	.pipe(cleancss())
    .pipe(gulp.dest(paths.styles.dist))
    .pipe(gzip())
    .pipe(gulp.dest(paths.styles.dist));
});

// Transpile Js for production
gulp.task('prod:js', function () {
  var b = browserify({
    entries: './src/js/all.js',
    debug: true,
    paths: paths.vendor.js
  });

  return b.bundle()
    .pipe(plumber())
    .pipe(source('all.js'))
    .pipe(buffer())
    .pipe(babel({
      compact: false,
      presets: ['env']
    }))
    .pipe(uglify())
    .pipe(gulp.dest(paths.js.dist))
    .pipe(gzip())
    .pipe(gulp.dest(paths.js.dist));
});

// Compile to HTML for production
gulp.task('prod:pug', ['copy:compress', 'prod:css', 'prod:js'], function(){
  return gulp.src(paths.views._src)
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest(paths.dist))
    .pipe(gzip())
    .pipe(gulp.dest(paths.dist));
});

gulp.task('build', ['prod:pug'], function () {
  return del([
    'tmp'
  ]);
});

/* ------------------------- *
 *        DEPLOYMENT
 * ------------------------- */

// Push dist folder to gh-pages branch for production
gulp.task('deploy', ['build'], function() {
  return gulp.src('dist/**/*')
    .pipe(deploy());
});

/* ------------------------- *
 *         DEFAULT
 * ------------------------- */

// Default task runner
gulp.task('default', ['serve']);
