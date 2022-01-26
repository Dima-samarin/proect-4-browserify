import fs from 'fs';
import pkg from 'gulp'
const {
	gulp,
	src,
	dest,
	parallel,
	series,
	watch
} = pkg


import uglify from 'gulp-uglify';
import gulpif from 'gulp-if';
import autoprefixer from 'gulp-autoprefixer';
import csso from 'gulp-csso';
import image from 'gulp-image';
import less from 'gulp-less';
import newer from 'gulp-newer';
import fileinclude from 'gulp-file-include';
import plumber from 'gulp-plumber';
import notify from 'gulp-notify';
import rename from 'gulp-rename';
import dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import ttf2woff from 'gulp-ttf2woff';
import ttf2woff2 from 'gulp-ttf2woff2';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import babel from 'gulp-babel';
import browserSync from 'browser-sync';
import del from 'del';



const srcPath = 'src/';
const distPath = 'dist/';

const path = {
	build: {
		html: distPath,
		js: distPath + 'assets/js',
		css: distPath + 'assets/css',
		images: distPath + 'assets/images',
		fonts: distPath + 'assets/fonts',
		resources: distPath
	},
	src: {
		html:   srcPath + '*.html',
		js: srcPath + 'assets/js/main.js',
		css: srcPath + 'assets/scss/styles.scss',
		images: srcPath + 'assets/images/**/*.{jpg,png,svg,gif,ico,webp,webmanifest,svg}',
		fonts: srcPath + 'assets/fonts/**/*.ttf',
		resources: srcPath + 'assets/resources/**/*.*'
	},
	watch: {
		html:   srcPath + "**/*.html",
		js: srcPath + 'assets/js/**/*.js',
		css: srcPath + 'assets/scss/**/*.scss',
		images: srcPath + 'assets/images/**/*.{jpg,png,gif,ico,webp,webmanifest,xml,json,svg}',
		fonts: srcPath + "assets/fonts/**/*.{woff,woff2}",
		resources: srcPath + 'assets/resources/**/*.*'
	},
	clean: "./" + distPath
}

function server() {
	browserSync.init({
		server: {
			baseDir: 'dist/'
		},
		notify: false,
		online: true
	})
}

function fontstyle(async) {
	let file_content = fs.readFileSync(srcPath + 'assets/scss/fonts.scss');
	if (file_content == '') {
		fs.writeFile(srcPath + 'assets/scss/fonts.scss', '', cb);
		return fs.readdir(path.build.fonts, function (err, items) {
			if (items) {
				let c_fontname;
				for (var i = 0; i < items.length; i++) {
					let fontname = items[i].split('.');
					fontname = fontname[0];
					if (c_fontname != fontname) {
						fs.appendFile(srcPath + 'assets/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
					}
					c_fontname = fontname;
				}
			}
		})
	}
	async ()
}

	function html() {
		return src(path.src.html)
		.pipe( fileinclude({ prefix: '@@' }) )
		.pipe(dest(path.build.html))
		.pipe(browserSync.stream());
	}

function css() {
	return src(path.src.css, { sourcemaps: true })
		.pipe(plumber({
			errorHandler: function (err) {
				notify.onError({
					title: "SCSS Error",
					message: "Error: <%= error.message %>"
				})(err);
				this.emit('end');
			}
		}))
		.pipe(sass())
		.pipe(autoprefixer({
			overrideBrowserslist: ['last 10 versions'],
			grid: true
		}))
		.pipe(dest(path.build.css))
		.pipe(csso())
		.pipe(rename({suffix: '.min'}))
		.pipe(dest(path.build.css, { sourcemaps: true }))
		.pipe(browserSync.stream());
}

function js(cb) {
	browserify(path.src.js, { debug: true })
	.transform('babelify', { presets: ['@babel/preset-env'] })
	.bundle()
	.on('error', function browserifyError(error) {
		console.log(error.stack);
		this.emit('end');
	})
	.pipe(source('main.js'))
	.pipe(buffer())
	.pipe(uglify())
	.pipe(rename({suffix: '.min'}))
	.pipe(dest(path.build.js, { sourcemaps: true }))
	cb();
}

function images() {
	return src(path.src.images)
		.pipe(newer(path.build.images))
		.pipe(image({
			pngquant: true,
			optipng: false,
			zopflipng: true,
			jpegRecompress: false,
			mozjpeg: true,
			gifsicle: true,
			svgo: true,
			concurrent: 10,
			quiet: true
		}))
		.pipe(dest(path.build.images))
		.pipe(browserSync.stream());
}

function fonts() {
	src(path.src.fonts)
		.pipe(ttf2woff())
		.pipe(dest(path.build.fonts))
	return src(path.src.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.stream());
}

function resources() {
	return src(path.src.resources)
		.pipe(dest(path.build.fonts))
		.pipe(browserSync.stream());
}

function clean() {
	return del(path.clean)
}

function startWatch() {
	watch(path.watch.html, html);
	watch(path.watch.css, css);
	watch(path.watch.js, js);
	watch(path.src.images, images);
	watch(path.src.fonts, fonts);
	watch(path.src.resources, resources);
}
export {
	html,
	css,
	js,
	images,
	fonts,
	resources,
	startWatch
}
export default series(clean,html,css,js,images,fonts,resources,fontstyle,parallel(server,startWatch));