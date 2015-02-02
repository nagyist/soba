var Trinity = {};

(function($M){
	Trinity = function(selector) {
		this.selector = selector;
		this.padding = {
			left: 30,
			right: 20,
			top: 20,
			bottom: 20,
		};
		this.margin = {
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		};
		var parent = d3.select(selector);
		this.w = Trinity.getStyle(parent[0][0], 'width');
		this.h = Trinity.getStyle(parent[0][0], 'height');
		this.w = this.w.replace('px', '');
		this.h = this.h.replace('px', '');
		var svg = parent
			.append("svg")
			.attr('width', this.w)
			.attr('height', this.h)
			;
		this.svg = svg;
		this.clf();
	};

	Trinity.prototype = {
		clf: function() {
			this.elements = [];
			this.surroundings = [];
			this.svg.selectAll('*').remove();
		},

		plot: function(x, y, option) {
			var obj = new Trinity.Plot(x.clone(), y.clone(), option);
			this.elements.push(obj);
		},

		scatter: function(x, y, color) {
			var obj = new Trinity.Scatter(x.clone(), y.clone(), color instanceof $M ? color.clone() : color);
			this.elements.push(obj);
		},

		contourDesicionFunction: function(x_min, x_max, y_min, y_max, func, func_){
			var decision_func;
			if (typeof func === 'function') {
				decision_func = func;
				var args = {};
			} else {
				decision_func = func_;
				var args = func;
			}
			
			var obj = new Trinity.ContourDesicionFunction(x_min, x_max, y_min, y_max, decision_func, args);
			this.elements.push(obj);
		},

		xlim: function(x_range) {
			if (!(0 in x_range) || !(1 in x_range)) {
				throw new TypeError('x_range must be an array and contain 2 elements');
			}
			this.x_range = x_range;
		},

		ylim: function(y_range) {
			if (!(0 in y_range) || !(1 in y_range)) {
				throw new TypeError('y_range must be an array and contain 2 elements');
			}
			this.y_range = y_range;
		},

		xlabel: function(title, options) {
			var obj = new Trinity.Label(title, options, 0);
			var g = this._reserveSurrounding('bottom', 40);
			this.surroundings.push([obj, g]);
		},

		ylabel: function(title, options) {
			var obj = new Trinity.Label(title, options, 270);
			var g = this._reserveSurrounding('left', 40);
			this.surroundings.push([obj, g]);
		},

		legend: function(titles, location) {
			var obj = new Trinity.Legend(this.elements, titles, location ? location : null, this.padding, this.margin);
			this.elements.push(obj);
		},
		
		colorbar: function() {
			this.elements.forEach(function(d){
				if (d instanceof Trinity.ContourDesicionFunction) {
					var obj = new Trinity.Colorbar(d);
					var g = this._reserveSurrounding('right', 40);
					this.surroundings.push([obj, g]);
//					this.elements.push(obj);
				}
			}, this);
		},
		
		_reserveSurrounding: function(location, width) {
			var g = this.svg.append('g');
			switch (location) {
				case 'top':
					break;
					
				case 'bottom':
					var x = this.margin.left;
					var y = this.h - this.margin.bottom - width;
					g
						.attr('transform', 'translate('+x+','+y+')')
						.attr('width', this.w - this.margin.left - this.margin.right)
						.attr('height', width)
					;
					this.margin.bottom += width;
					break;
					
				case 'right':
					var x = this.w - this.margin.right - width;
					var y = this.margin.top;
					g
						.attr('transform', 'translate('+x+','+y+')')
						.attr('width', width)
						.attr('height', this.h - this.margin.top - this.margin.bottom)
					;
					this.margin.right += width;
					break;
					
				case 'left':
					var x = this.margin.left;
					var y = this.margin.top;
					g
						.attr('transform', 'translate('+x+','+y+')')
						.attr('width', width)
						.attr('height', this.h - this.margin.top - this.margin.bottom)
					;
					this.margin.left += width;
					break;
			}
			
			return g;
		},

		show: function() {
			// Determine the ranges
			var x_range_init = this.x_range, y_range_init = this.y_range;
			var x_range = null, y_range = null;
			this.elements.forEach(function(d) {
				if (d.x_range) {
					if (x_range) {
						if (!x_range_init || x_range_init[0]===null) x_range[0] = Math.min(x_range[0], d.x_range()[0]);
						if (!x_range_init || x_range_init[1]===null) x_range[1] = Math.max(x_range[1], d.x_range()[1]);
					} else {
						if (x_range_init) {
							x_range = [x_range_init[0]!==null ? x_range_init[0] : d.x_range()[0], x_range_init[1]!==null ? x_range_init[1] : d.x_range()[1]];
						} else {
							x_range = d.x_range();
						}
					}
				}
				if (d.y_range) {
					if (y_range) {
						if (!y_range_init || y_range_init[0]===null) y_range[0] = Math.min(y_range[0], d.y_range()[0]);
						if (!y_range_init || y_range_init[1]===null) y_range[1] = Math.max(y_range[1], d.y_range()[1]);
					} else {
						if (y_range_init) {
							y_range = [y_range_init[0]!==null ? y_range_init[0] : d.y_range()[0], y_range_init[1]!==null ? y_range_init[1] : d.y_range()[1]];
						} else {
							y_range = d.y_range();
						}
					}
				}
			});
			y_range[1] = [y_range[0], y_range[0] = y_range[1]][0]; // Swap

			var xScale = d3.scale.linear()
				.domain(x_range)
				.range([this.padding.left + this.margin.left, this.w - this.padding.right - this.margin.right]);

			var yScale = d3.scale.linear()
				.domain(y_range)
				.range([this.padding.top + this.margin.top, this.h-this.padding.bottom - this.margin.bottom]);

			this.elements.forEach(function(d){
				d.show(this.svg, xScale, yScale);
			}, this);

			this.surroundings.forEach(function(d){
				d[0].show(d[1]);
			}, this);
			
			this.drawAxis(xScale, yScale);
			if (this.xlabel_settings) {
				this._drawXLabel(this.xlabel_settings);
			}
			if (this.ylabel_settings) {
				this._drawYLabel(this.ylabel_settings);
			}
		},
		
		drawAxis: function(xScale, yScale) {
			var xAxis = d3.svg.axis()
				.scale(xScale)
				.ticks(5)
				.orient("bottom");

			var yAxis = d3.svg.axis()
				.scale(yScale)
				.ticks(5)
				.orient("left");

			this.svg.append('g')
				.attr("class", "axis")
				.attr('transform', 'translate(0,'+(this.h-this.padding.bottom-this.margin.bottom)+')')
				.call(xAxis);
			this.svg.append('g')
				.attr("class", "axis")
				.attr('transform', 'translate('+(this.padding.left+this.margin.left)+', 0)')
				.call(yAxis);
		},

		_drawXLabel: function(xlabel_settings) {
			var title = xlabel_settings.title;
			var options = xlabel_settings.options ? xlabel_settings.options : {};
			var fontsize = options.fontsize ? options.fontsize : 20;
			var xlabel_height = fontsize, xlabel_width = title.length * fontsize / 2;
			var xlabel_top = this.h - xlabel_height;
			var xlabel_left = (this.w - this.padding.left -this.padding.right - xlabel_width) / 2 + this.padding.left;
			var base = this.svg
			.append('g')
			.attr('width', xlabel_width)
			.attr('height', xlabel_height)
			.attr('transform', 'translate('+xlabel_left+','+xlabel_top+')')
			;

			var label = base.append('text')
			.text(title)
			.attr('x', 0)
			.attr('y', 0)
			.attr('text-anchor', 'middle')
			.attr('font-size', fontsize)
			;
		},

		_drawYLabel: function(ylabel_settings) {
			var title = ylabel_settings.title;
			var options = ylabel_settings.options ? ylabel_settings.options : {};
			var fontsize = options.fontsize ? options.fontsize : 20;
			var ylabel_height = title.length * fontsize / 2, ylabel_width = fontsize;
			var ylabel_top = (this.h - this.padding.top - this.padding.bottom - ylabel_height) / 2 + this.padding.top;
			var ylabel_left = ylabel_width;

			var base = this.svg
			.append('g')
			.attr('width', ylabel_width)
			.attr('height', ylabel_height)
			.attr('transform', 'translate('+ylabel_left+','+ylabel_top+') rotate(270)')
			;

			var label = base.append('text')
			.text(title)
			.attr('x', 0)
			.attr('y', 0)
			.attr('text-anchor', 'middle')
			.attr('font-size', fontsize)
			;
		}

	};

	/* Static methods */
	Trinity.getStyle = function(el, prop) {
		if (el.currentStyle) {
			return el.currentStyle[prop];
		} else if (window.getComputedStyle) {
			return document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
		}
		return null;
	};
	
	/* Sub classes */
	Trinity.Plot = function(x, y, option){
		this.x = x;
		this.y = y;
		this.option = option;
	};
	Trinity.Plot.prototype = {
		x_range: function(){
			if (!this._x_range) {
				this._x_range = [$M.min(this.x), $M.max(this.x)];
			}
			return this._x_range;
		},
		y_range: function(){
			if (!this._y_range){
				this._y_range = [$M.min(this.y), $M.max(this.y)];
			}
			return this._y_range;
		},
		show: function(svg, xScale, yScale){
			var x = this.x, y = this.y, option = this.option;
			option = option ? option : '';
			var xArray = $M.toArray(x);

			var style = this._parsePlotOption(option);
			if (style.circle) {
				svg.append('g').selectAll("circle")
					.data(xArray)
					.enter()
					.append("circle")
					.attr("cx", function(d, i){
						return xScale(d);
					})
					.attr('cy', function(d, i){
						return yScale(y.get(i,0));
					})
					.attr('fill', style.circle.fill)
					.attr('r', 2);
			}
			if (style.line) {
				var line = d3.svg.line()
					.x(function(d, i){
						return xScale(d);
					})
					.y(function(d, i){
						return yScale(y.get(i,0));
					})
					.interpolate('linear');

				var path = svg.append('path')
					.datum(xArray)
					.attr('d', line)
					.attr('fill', style.line.fill)
					.attr('stroke', style.line.stroke)
					.attr('stroke-width', 2);

				if (style.line.stroke_dasharray) {
					path.attr('stroke-dasharray', style.line.stroke_dasharray);
				}
			}
		},
		
		drawLegend: function(g, title) {
			var style = this._parsePlotOption(this.option);
			var x_start=5, x_end = 35;
			var y = -5;
			if (style.circle) {
				for (var x=x_start ; x<=x_end ; x+=10) {
					g.append('circle')
					.attr('cx', x)
					.attr('cy', y)
					.attr('fill', style.circle.fill)
					.attr('r', 2)
					;
				}
			}
			if (style.line) {
				var line = g.append('line')
				.attr('x1', x_start)
				.attr('y1', y)
				.attr('x2', x_end)
				.attr('y2', y)
				.attr('stroke', style.line.stroke)
				.attr('stroke-width', 2)
				;
				if (style.line.stroke_dasharray) {
					line.attr('stroke-dasharray', style.line.stroke_dasharray);
				}
			}
			
			if (title) {
				var textarea = g.append('text').text(title)
				.attr('font-size', 10)
				.attr('x', x_end + 10)
				.attr('y', 0)
				;
			
				var bbox = textarea.node().getBBox();
				return bbox.x + bbox.width;
			} else {
				return x_end;
			}
		},
		
		_parsePlotOption: function(option) {
			var res = {
				circle: null,
				line: null
			};

			if (!option) option = 'b-';

			if (option.indexOf('o') >= 0) {
				res.circle = {
					fill: this._parseColor(option),
					stroke: null
				};
			}
			if (option.indexOf('-') >= 0 || option.indexOf(':') >= 0) {
				res.line = {
					fill: 'none',
					stroke: this._parseColor(option),
					stroke_dasharray: null
				};
				if (option.indexOf('--') >= 0) {
					res.line.stroke_dasharray = '5,5';
				} else if (option.indexOf('-.') >= 0) {
					res.line.stroke_dasharray = '4,6,2,6';
				} else if (option.indexOf(':') >= 0) {
					res.line.stroke_dasharray = '2,3';
				}
			}

			return res;
		},

		_parseColor: function(option) {
			if (!option) return 'blue';
			var colors = {
				b: 'blue',
				g: 'green',
				r: 'red',
				c: 'cyan',
				m: 'magenta',
				y: 'yellow',
				k: 'black',
				w: 'white'
			}
			for (var key in colors) {
				if (option.indexOf(key) >= 0) {
					return colors[key];
				}
			}
			return 'blue';
		},
	};
	
	Trinity.Scatter = function(x, y, color){
		this.x = x;
		this.y = y;
		this.color = color;
	};
	Trinity.Scatter.prototype = {
		x_range: function(){
			if (!this._x_range) {
				this._x_range = [$M.min(this.x), $M.max(this.x)];
			}
			return this._x_range;
		},
		y_range: function(){
			if (!this._y_range){
				this._y_range = [$M.min(this.y), $M.max(this.y)];
			}
			return this._y_range;
		},
		show: function(svg, xScale, yScale){
			var x = this.x, y = this.y, color = this.color;

			var color_list = d3.scale.category20();

			var xArray = $M.toArray(x);

			svg.append('g').selectAll("circle")
				.data(xArray)
				.enter()
				.append("circle")
				.attr("cx", function(d, i){
					return xScale(d);
				})
				.attr('cy', function(d, i){
					return yScale(y.get(i,0));
				})
				.attr('fill', function(d, i){
					return color instanceof $M ? color_list(color.get(i,0)) : color_list(1);
				})
				.attr('r', 2);
		},
		drawLegend: function(g, title){
			var x = this.x, y = this.y, color = this.color;
			var color_list = d3.scale.category20();

			var x_start=10, x_end = 30;
			var y = -3;

			var legend_color_list = [];
			if (color instanceof $M) {
				var color_ = $M.toArray(color.t())[0];
				var legend_color_list = color_.filter(function (x, i, self) { // Unique array
					return self.indexOf(x) === i;
				});
			} else {
				var legend_color_list = [1];
			}

			if (legend_color_list.length > 1) {
				for (var i=0 ; i<legend_color_list.length ; i++) {
					var x = x_start + (x_end - x_start) * i / (legend_color_list.length-1);
					g.append('circle')
					.attr('cx', x)
					.attr('cy', y)
					.attr('fill', color_list(legend_color_list[i]))
					.attr('r', 2);
					;
				}
			} else {
				g.append('circle')
				.attr('cx', (x_end-x_start)/2+x_start)
				.attr('cy', y)
				.attr('fill', color_list(legend_color_list[1]))
				.attr('r', 2);
				;
			}

			var textarea = g.append('text').text(title)
			.attr('font-size', 10)
			.attr('x', x_end + 15)
			.attr('y', 0)
			;
			
			var bbox = textarea.node().getBBox();
			return bbox.x + bbox.width;
		}
	};
	
	Trinity.ContourDesicionFunction = function(x_min, x_max, y_min, y_max, decision_func, args){
		this.x_min = x_min;
		this.x_max = x_max;
		this.y_min = y_min;
		this.y_max = y_max;
		this.decision_func = decision_func;
		this.args = args;
	};
	Trinity.ContourDesicionFunction.prototype = {
		x_range: function(){
			return [this.x_min, this.x_max];
		},
		y_range: function(){
			return [this.y_min, this.y_max];
		},
		color: function(t){
			return d3.hsl((1-t) * 300, 1, .5);
		},
		domain: function(){
			if (this.mesh_min && this.mesh_max) {
				return [this.mesh_min, this.mesh_max];
			}
		},
		show: function(svg, xScale, yScale){
			var x_min = this.x_min, x_max = this.x_max, y_min = this.y_min, y_max = this.y_max, decisionFunction = this.decision_func, args = this.args;
			var x_bins = 100, y_bins = 100;
			var mesh = new Array(x_bins);
			var xmap = new Array(x_bins);
			var ymap = new Array(x_bins);
			var mesh_min = null, mesh_max = null;
			for (var ix=0 ; ix<x_bins ; ix++) {
				mesh[ix] = new Array(y_bins);
				xmap[ix] = new Array(y_bins);
				ymap[ix] = new Array(y_bins);
				for (var iy=0 ; iy<y_bins ; iy++) {
					var x = x_min + (x_max-x_min)*ix/x_bins;
					var y = y_min + (y_max-y_min)*iy/y_bins;
					var val = decisionFunction(x, y);
					mesh[ix][iy] = val;
					if (mesh_max===null || mesh_max < val) mesh_max = val;
					if (mesh_min===null || mesh_min > val) mesh_min = val;
					xmap[ix][iy] = x;
					ymap[ix][iy] = y;
				}
			}
			this.mesh_min = mesh_min, this.mesh_max = mesh_max;

			// Determine levels
			var levels;
			if (args.levels) {
				levels = args.levels;
			} else {
				var n_levels = 10;
				var levels = new Array(n_levels);
				for (var i=0 ; i<n_levels ; i++) {
					levels[i] = mesh_min + (mesh_max-mesh_min)*i/(n_levels-1);
				}
				/*
				var levels = [];
				for (var i=Math.ceil(mesh_min) ; i<=Math.floor(mesh_max) ; i++) {
					levels.push(i);
				}
				*/
			}

			function findPathInGrid(edges, level) {
				var points = [];
				for (var i=0; i<edges.length; i++) {
					var i2 = (i+1)%edges.length;
					if ((edges[i][2]-level) * (edges[i2][2]-level) < 0) {
						var offset = (level-edges[i][2])/(edges[i2][2]-edges[i][2]);
						points.push([
							edges[i][0] + (edges[i2][0]-edges[i][0])*offset,
							edges[i][1] + (edges[i2][1]-edges[i][1])*offset
						]);
					}
				}
				return points;
			}

			var edges = new Array(4);
			levels.forEach(function(level){
				var level_color = this.color((level-mesh_min)/(mesh_max-mesh_min));
				// Scan and draw lines
				for (var ix=0 ; ix<x_bins-1 ; ix++) {
					for (var iy=0 ; iy<y_bins-1 ; iy++) {
						edges[0] = [xmap[ix  ][iy  ], ymap[ix  ][iy  ], mesh[ix  ][iy  ]];
						edges[1] = [xmap[ix+1][iy  ], ymap[ix+1][iy  ], mesh[ix+1][iy  ]];
						edges[2] = [xmap[ix+1][iy+1], ymap[ix+1][iy+1], mesh[ix+1][iy+1]];
						edges[3] = [xmap[ix  ][iy+1], ymap[ix  ][iy+1], mesh[ix  ][iy+1]];

						var points = findPathInGrid(edges, level);

						if (points.length == 2) {
							var line = d3.svg.line()
							.x(function(d){
								return xScale(d[0]);
							})
							.y(function(d){
								return yScale(d[1]);
							})
							.interpolate('linear');

							var path = svg.append('path')
							.datum(points)
							.attr('d', line)
							.attr('fill', 'none')
							.attr('stroke', level_color)
							.attr('stroke-width', 2);
						}
					}
				}

			}, this);
		}
	};
	
	Trinity.Label = function(title, options, orientation){
		this.title = title;
		this.options = options ? options : {};
		this.orientation = orientation ? orientation : 0;
	};
	Trinity.Label.prototype = {
		show: function(g){
			var title = this.title;
			var options = this.options;
			var fontsize = options.fontsize ? options.fontsize : 20;

			var label = g.append('text')
				.text(title)
				.attr('dominant-baseline', 'text-before-edge')
				.attr('font-size', fontsize)
			;
			
			var bbox = label.node().getBBox();
			var label_w = bbox.width, label_h = bbox.height;
			var g_w = g.attr('width'), g_h = g.attr('height');
			
			var rad = this.orientation * Math.PI / 180;
			var x = g_w/2 - label_w/2*Math.cos(rad) + label_h/2*Math.sin(rad);
			var y = g_h/2 - label_w/2*Math.sin(rad) - label_h/2*Math.cos(rad);
			label.attr('transform', 'translate('+x+','+y+') rotate('+this.orientation+')');
		}
	};
	
	Trinity.Legend = function(elements, titles, location, padding, margin){
		this.elements = elements;
		this.titles = titles;
		this.location = location;
		this.padding = padding;
		this.margin = margin;
	};
	Trinity.Legend.prototype = {
		show: function(svg){
			var base = svg
			.append('g')
			;

			var frame = base
			.append('rect')
			.attr('fill', 'white')
			.attr('stroke', 'black')
			;

			var i = 0;
			var widths = [];
			this.elements.forEach(function(d){
				if (d.drawLegend) {
					var x = 10;
					var y = 15 + i*15;
					var title = this.titles && this.titles[i] ? this.titles[i] : '';
					var g = base.append('g').attr('transform', 'translate('+x+','+y+')');
					var w = d.drawLegend(g, title);
					widths.push(w);
					i++;
				}
			}, this);
			var n_legends = i;
			
			var svg_w = svg.attr('width'), svg_h = svg.attr('height');
			var max_width = widths.length > 0 ? Math.max.apply(null, widths) : 0;
			var frame_width = max_width + 20, frame_height = 15*n_legends+10;
			var legend_margin = 10;
			var legend_top = (svg_h - frame_height)/2;
			var legend_left = (svg_w - frame_width)/2;
			
			var legend_loc = this.location ? this.location : 'upper right';
			if (legend_loc.indexOf('upper') >= 0) {
				legend_top = this.padding.top + this.margin.top + legend_margin;
			} else if (legend_loc.indexOf('bottom') >= 0) {
				legend_top = svg_h - this.padding.bottom - this.margin.bottom - frame_height - legend_margin;
			}
			if (legend_loc.indexOf('left') >= 0) {
				legend_left = this.padding.left + this.margin.left + legend_margin;
			} else if (legend_loc.indexOf('right') >= 0) {
				legend_left=svg_w - this.padding.right - this.margin.right - frame_width - legend_margin;
			}
			
			base
				.attr('transform', 'translate('+legend_left+','+legend_top+')')
				;
			
			frame
				.attr('width', frame_width)
				.attr('height', frame_height)
				;
		}
	};
	
	Trinity.Colorbar = function(contour_obj) {
		this.contour = contour_obj;
		Trinity.Colorbar.count++;
	}
	Trinity.Colorbar.count = 0;
	Trinity.Colorbar.prototype = {
		show: function(g) {
			var g_w = g.attr('width'), g_h = g.attr('height');
			
			var w = g_w - 20, h = g_h - 80;
			var x = 20, y = (g_h - h)/2;
			var base = g.append('g')
				.attr('transform', 'translate('+x+', '+y+')')
			;

			var n_divs = 10;
			var color = this.contour.color;
			
			var scale = d3.scale.linear()
				.domain([0,n_divs])
				.range([0, h]);
			
			var defs = g.append('svg:defs');
			var id_prefix = 'cl_' + Trinity.Colorbar.count + '_';
			for (var i=0 ; i<n_divs ; i++) {
				var id = id_prefix + i;
				var gradient = defs
					.append("svg:linearGradient")
					.attr("id", id)
					.attr("x1", "0%")
					.attr("y1", "0%")
					.attr("x2", "0%")
					.attr("y2", "100%")
				;
				gradient
					.append('svg:stop')
					.attr('offset', '0%')
					.attr('stop-color', color(1-(i/n_divs)))
					.attr('step-opacity', 1)
				;
				gradient
					.append('svg:stop')
					.attr('offset', '100%')
					.attr('stop-color', color(1-((i+1)/n_divs)))
					.attr('stop-opacity', 1)
				;
				
				base.append('rect')
					.attr('x', 0)
					.attr('y', scale(i))
					.attr('width', w)
					.attr('height', h/n_divs)
					.attr('fill', 'url(#'+id+')')
				;
			}
			
			var domain = this.contour.domain();
			if (domain) {
				var axis_scale = d3.scale.linear()
					.domain(domain)
					.range([h, 0]);

				this.drawAxis(base, axis_scale);
			}
			
		},
		
		drawAxis: function(base, scale) {
			var axis = d3.svg.axis()
				.scale(scale)
				.ticks(5)
				.orient('left');
			
			base.append('g')
				.attr('class', 'colorbar-axis')
				.call(axis);
		},
	};

})(AgentSmith.Matrix);