/* CREAM.dev.js */
var CREAM = ( function () {

	var cache = {};

	var self = function( cache ) {
		if( cache ) {
			this.cache = preheatCache( cache );
		}
	}
	
	self.prototype.set = function( request ) {	
		var key = request.key || null
		    , value = request.value || null
		    , ttl = request.ttl || null //in seconds
		    , current_date = new Date()
		    , timestamp = ( current_date.getTime() + ( ttl * 1000 ) )
		    , obj = {}
		    , precount = 0;

		if( 'function' === typeof value ) {
			value = value()
		}	

		if( -1 !== key.indexOf( '.' ) ) {
			precount = key.split('.').length;
			while( key && -1 !== key.indexOf( '.' ) ) {
				keys = key.split( '.' );
				new_obj = {};
				key = keys.pop();
				if( 'undefined' === typeof key ) {
					break;
				}
				if( ( precount - 1 )=== keys.length ) {
					new_obj[ key ] = {
						'timestamp': timestamp
						, 'data': value
					};
				} else {
					new_obj[ key ] = {
						'timestamp': timestamp
						, 'data': obj
					};
				}
				obj = new_obj;
				key = keys.join( '.' );
			}
			new_obj = {};
			new_obj[ key ] = {
				'timestamp': timestamp
				, 'data': obj
			};
			obj = new_obj;
		} else {
			cache[ key ] = {
				'timestamp': timestamp
				, 'data': obj
			};
		}
		console.log('merging',cache,obj);
		cache = mergeObjects( cache, obj );
		console.log('merged cached',cache);
		return this;
	};

	self.prototype.get = function( request ) {
		var key = request.key || null
		  , result = {}
		  , keys = []
		  , res = {};
		if( -1 !== key.indexOf( '.' ) ) {
			result = cache;
			while( key && -1 !== key.indexOf( '.' ) ) {
				keys = key.split( '.' );
				key = keys.shift();
				if( 'undefined' !== typeof result && 'undefined' !== typeof result.key ) {	
					res = result[ key ];
					console.log('im sure theyre great people, but strange', res );
					if( 'undefined' !== typeof res && res[ 'data' ] ) {
						result = res[ 'data' ];
					} else {
						result = res;
					}
				}
				key = keys.join( '.' );
			}
			result = result[ key ];
		} else {
			result = cache[ key ];
		}
		return filterOutput( key, result );

	};

	self.prototype.delete = function( request ) {
		var key = request.key || null;
		var result = {};
		if( -1 !== key.indexOf( '.' ) ) {
			result = cache;
			while( key && -1 !== key.indexOf( '.' ) ) {
				var keys = key.split( '.' );
				key = keys.shift();
				result = result[ key ][ 'data' ];
				key = keys.join( '.' );
			}
			delete result[ key ];
			cache = result;
		} else {
			delete cache[ key ];
		}

		return this;

	};

	self.prototype.pop = function( request ) {

		request.value = function( previous ) {
			return updateAndReturn( request.key, previous.pop() );
		};

		self.prototype.update( request );

		return this;

	};

	self.prototype.head = function( request ) {

		request.value = function( previous ) {
			return updateAndReturn( request.key, previous.shift() );
		};

		self.prototype.update( request );

		return this;

	};


	self.prototype.slice = function( request ) {

		request.value = function( previous ) {
			return updateAndReturn( request.key, previous.slice( request.begin, request.end ) );
		};

		self.prototype.update( request );

		return this;
	};

	// key, property
	self.prototype.remove = function( request ) {

		request.value = function( previous ) {
			delete previous[ request.property ] 
			return updateAndReturn( request.key, previous );
		};

		return self.prototype.update( request );
		
		return this;

	};

	self.prototype.prepend = function( request ) {

		request.value = function( previous ) {
			var value = request.value;
			if( 'string' === typeof previous ) {
				previous = value + previous;
			} else {
				previous.unshift( request.value );
			}
			return updateAndReturn( request.key, previous );
		};

		self.prototype.update( request );

		return this;

	};

	self.prototype.append = function( request ) {

		request.value = function( previous ) {
			var value = request.value;
			if( 'string' === typeof previous ) {
				previous = previous + value;
			} else {
				previous.push( request.value );
			}

			return updateAndReturn( request.key, previous );
		};

		self.prototype.update( request );

		return this;

	};

	self.prototype.increment = function( request ) {

		request.value = function( previous ) {
			previous += request.value;
			return updateAndReturn( request.key, previous );
		};

		self.prototype.update( request );

		return this;

	};

	self.prototype.update = function( request ) {

		var key = request.key || null
		  , value = request.value || null;

		var previous = self.prototype.get( key );

		if( 'function' === typeof value ) {
			value = value( previous );
		}

		cache[ key ] = {
			'timestamp': self.prototype.getExpires( { 'key': key } )
			, 'data': value
		};

		return this;

	};

	self.prototype.setExpires = function( request ) {

		var key = request.key || null
		    , timestamp = request.timestamp || 0;

		if( 'undefined' !== typeof cache[ key ] ) {
			cache[ key ][ 'timestamp' ] = timestamp;
		}

		return this;
	};


	self.prototype.getExpires = function( request ) {

		var key = request.key || null
		    , result = cache[ key ];

		if( 'undefined' !== typeof result ) {
			return result.timestamp;
		}
	
	};

	self.prototype.extendTTL = function( request ) {

		var key = request.key || null
		    , current = self.prototype.getExpires( { 'key': key } )
		    , timestamp = ( current + request.value );

		self.prototype.setExpires( { 'key': key, 'timestamp': timestamp } );

		return this;			    

	};

	self.prototype.shortenTTL = function( request ) {

		var key = request.key || null
		    , current = self.prototype.getExpires( { 'key': key } )
		    , timestamp = currrent + request.value;
		
		self.prototype.setExpires( { 'key': key, 'timestamp': timestamp } );

		return this;

	};

	self.prototype.increment = function( request ) {

		request.value = function( previous ) {
			previous += request.value;
			return updateAndReturn( request.key, previous );
		};

		self.prototype.update( request );

		return this;

	};

	var hasAttributes = function( question ) {
		var answer = false;
		if( 'string' === typeof question ) {
			return answer;
		}
		for( attr in question ) {
			if( question.hasOwnProperty( attr ) ) {
				answer = true;
				break;
			}
		}
		return answer;
	};

	var preheat = function( incoming, ttl ) {
	
		if( 'undefined' === typeof incoming ) {
			throw Error( 'The oven can\'t be empty.' );
		}
		var outgoing = {}
		  , item = {}
		  , current_date = new Date()
		  , ttl = ( 'number' === typeof ttl ) ? ttl : 0
		  , item_timestamp = ( 0 === ttl ) ? 0 : current_date.getTime() + ttl;
		
		for( attr in incoming ) {
			item = incoming[ attr ];
			if( incoming.hasOwnProperty( attr ) ) {
				if( true === hasAttributes( item ) ) {
					outgoing[ attr ] = preheat( incoming, ttl );	
				}	
			} else {
				outgoing[ attr ] = {
					'data': item
					, 'timestamp': item_timestamp	
				};
			}
		}
		
		return outgoing;
	};

	var updateAndReturn = function( request ) {
		var key = request.key || null
		  , value = request.value || null
		  , timestamp = getExpires( { 'key': key } );

		self.prototype.update( { 'key': key, 'value': value, 'timestamp': timestamp } );
		
		return value;
	};

	var isStale = function( request ) {
		var current_date = new Date()
		  , current_time = current_date.getTime()
		  , timestamp = ( 'undefined' !== typeof request && null !== request && 'undefined' !== typeof request.timestamp ) ? request.timestamp : null;

		if( 'undefined' === typeof timestamp || null === timestamp) {
			return false;
		}
		return ( timestamp > current_time ) ? false : true;
	}

	var removeMeta = function( incoming ) {
		var result = {};
		console.log('removing meta. has attr?',hasAttributes(incoming),incoming);
		if( false === hasAttributes( incoming ) ) {
			console.log('removing meta',data);
			return incoming;
		}
		console.log('foreaching throguh meta',incoming);
		for( attr in incoming ) {
			console.log('foreach attr',attr);
			if( incoming.hasOwnProperty( attr ) ) {
				var data = incoming[ attr ];
				console.log('datatata',data);
				if( !isStale( data ) ) {
					console.log('recursive',data);
					result[ attr ] = ( 'undefined' !== typeof data.data ) ? removeMeta( data.data ) : data;
				} 
			}
		}
		return result;
	};

	var filterOutput = function( key, request ) {
		var timestamp = ( 'undefined' !== typeof request && 'undefined' !== typeof request.timestamp ) ? parseInt( request.timestamp, 10 ) : 0
		   , data = ( 'undefined' !== typeof request && 'undefined' !== typeof request.data ) ? request.data : null
		   , key = ( 'undefined' !== typeof request && 'undefined' !== typeof request.key ) ? request.key : null
		   , stale = isStale( data );
		if( 'undefined' !== typeof data && null !== data ) {
			return removeMeta( data );
		} else {
			if( stale ) {
				self.prototype.delete( { 'key': key } );
			}
			return null;
		}
	};

	var mergeObjects = function( obj1, obj2 ) {
		if( 'undefined' === typeof obj1 ) {
			obj1 = {};
		}
		if( 'undefined' === typeof obj2 ) {
			obj2 = {};
		}
		var obj3 = {}
		  , attr = '';
		if ( false === hasAttributes( obj2 ) ) {
			console.log("RETURNING obj1",obj1);
			return obj1;
		}
		if ( false === hasAttributes( obj1 ) ) {
			console.log("RETURNING obj2",obj2);
			return obj2;
		}	
		for( attr in obj1 ) {
			if( obj1.hasOwnProperty( attr ) ) {
				var next = obj1[ attr ];
				if( 'undefined' !== typeof next && hasAttributes( next ) ) {
					obj3[ attr ] = mergeObjects( obj3[ attr ], next );
				} else {
					obj3[ attr ] = next;
				}
			}
		}
		for( attr in obj2 ) {
			if( obj2.hasOwnProperty( attr ) ) {
				var next = obj2[ attr ];
				if( 'undefined' !== typeof next && hasAttributes( next ) ) {
					obj3[ attr ] = mergeObjects( obj3[ attr ], next );
				} else {
					obj3[ attr ] = next;
				}
			}
		}
		return obj3;
	}

	return self;

})();
