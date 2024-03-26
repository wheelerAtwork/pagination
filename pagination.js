/**
 * PAGINATION
 * Ver: 2.1.0
 * Author: Tommy Wheeler
 * 
 * Adds pagination for a set of data
 *
 * USES
 * There are 2 ways to use pagination
 * ------------------------------------------------------- * 
 * 1) Render a default table with data
 * 	- Requires a wrapper element to be assigned to this.tableWrapper
 * 	- Requires this.table.columns to render data *
 * ------------------------------------------------------- * 
 * 2) Use pagination to handle data rendering
 * 	- Requires a wrapper element to be assigned to this.wrapper
 * 	- Requires a function to be bound to this.renderMethod
 * 		+ Additional parameters may be passed to this.renderMethod through this.params as an array [] *
 * -------------------------------------------------------
 * 
 * INITIALIZATION
 * Passing an object on initialization is possible if you wish
 * 	- If using pagination to render a default table this will build the table immediately
 * 	
 * If you do not wish to build the table on the pagination object's creation
 * 	- Assign a wrapper element to this.tableWrapper
 * 	- Call this.buildTable passing a table object (this.table) as a param
 * 		+ Make sure to set column objects to render correctly
 */
class Pagination2 {
	constructor(initialize = null) {
		/**
		 * Element wrapper for paginated content to render
		 * @type {*|jQuery|HTMLElement}
		 */
		this.wrapper = null;
		/**
		 * Element wrapper for pagination navigation menu to render
		 * @type {*|jQuery|HTMLElement}
		 */
		this.menuWrapper = null;		
		/**
		 * Element wrapper for default table to render
		 * @type {*|jQuery|HTMLElement}
		 */
		this.tableWrapper = null;
		
		this.id = this.__generateId();
		this.results = [];
		this.resultsTypes = {};
		this.searches = [];
		this.useNavigation = true;
		this.page = 1;
		this.limit = 10;
		this.limitText = 'rows';
		this.limitOptions = [10, 25, 50, 100];
		this.showLimiter = true;
		this.initSort = null;
		
		/**
		 * Bind method to handle rendering html
		 * @type {null | function}
		 */
		this.renderMethod = null;		
		// Optional arguments for render method
		this.params = [];
		
		/**
		 * Bind method to handle after renderMethod actions
		 * @type {null | function}
		 */
		this.postRenderMethod = null;
		
		/**
		 * Default table object
		 * @type {{
		 * 		title: string|null,
		 * 		mobileTitles: boolean,
		 * 		emptyMessage: string,
		 * 		counter: {
		 * 			enabled: boolean,
		 * 			text: string,
		 * 		}, 
		 * 		search: {
		 * 			enabled: boolean,
		 * 			placeholder: string,
		 * 			class: string,
		 * 		}, 
		 * 		columns: [{
		 * 			title: string, class: string,
		 * 			dataName: string, 
		 * 			html: string,	
		 * 			sort: {activeDirection: string, active: boolean}, 
		 * 			modifier: {method: function, params: *[]}, 
		 * 		}], 
		 * 	}}
		 */
		this.table = {
			// Table title
			title: null,
			// Show col titles in line on mobile devices
			mobileTitles: false,
			// No results message
			emptyMessage: 'No results available',
			// Display results total
			counter: {
				// Use counter
				enabled: true,
				// Display results type
				text: 'results',
			},
			// Display quick search
			search: {
				// Use search
				enabled: true,
				// Set search placeholder
				placeholder: 'Search...',
				// Add additional classes to search wrapper
				class: '',
			},
			/**
			 * The columns array defines the header and row columns being rendered
			 * - title => name of the col
			 * - dataName => data var name to insert in col
			 * - class => (optional) col class [Default => 'col']
			 * - html => (optional) appends html to the specified col; *Wrap the object value name in {{example}}
			 * - sort => (optional) {
			 * 		active => defines if the col should be active on load
			 * 		activeDirection => sets the default sort direction on init click [Default => 'asc']
			 * }
			 * - modifier => (optional) {
			 * 		method => defines a method to apply to the col data value
			 * 		params => passes in any additional parameters to the method [Default => []]
			 * }
			 * 
			 * EX:
			 * 	{title: 'Name', class: 'col-4', dataName: 'name', sort: {active: true, activeDirection: 'desc'}},
			 * 	{title: 'Data', dataName:'data', modifier: { method: currencyFormat, params: [true, false]}},
			 * 	{title: 'Details', class: 'col-2', dataName: 'details'},
			 * 	{title: 'Custom', dataName: 'custom', html: "<i class='custom-icon'></><p>{{custom}}</p>"},
			 */
			columns: [],
		}
		
		if(initialize){
			this.__init(initialize)
		}
		
		if(this.tableWrapper && this.table.columns.length > 0){
			this.__initTable();
		}
	}
	
	/**
	 * PRIVATE Method
	 * Pass obj to constructor to initialize class on creation
	 * @param initialize
	 * @private
	 */
	__init(initialize){
		if(typeof initialize === 'object') {
			Object.entries(initialize).forEach(v => {
				this[v[0]] = v[1];
			})
		}
	}
	
	/**
	 * PRIVATE Method
	 * Init default table rendering
	 * @private
	 */
	__initTable(){
		// Check if wrapper assigned
		if(!this.wrapper) {
			// Assign table wrapper to wrapper
			this.wrapper = this.tableWrapper;
		}
		
		// Check for render method assignment
		if(!this.renderMethod) {
			// Assign default row builder
			this.renderMethod = this.__buildRows;
		}
		
		// Build table
		this.buildTable();
	}
	
	/**
	 * PRIVATE Method
	 * Generate id for class init
	 * @returns {number}
	 * @private
	 */
	__generateId(){
		let min = 10000;
		let max = 99999;
		// find diff
		let difference = max - min;
		
		// generate random number 
		let rand = Math.random();
		
		// multiply with difference 
		rand = Math.floor( rand * difference);
		
		// add with min value 
		return rand + min;
	}
	
	/**
	 * PRIVATE Method
	 * Get last page from results'
	 * @private
	 */
	__getLastPage(data = this.results){
		return Math.ceil(data.length / this.limit);
	}
	
	/**
	 * Converts value to resultsTypes type
	 * @param col
	 * @param value
	 * @returns {number | string}
	 * @private
	 */
	__setType(col, value){
		// Check for results type column
		if(this.resultsTypes && Object.keys(this.resultsTypes).length > 0){
			if(this.resultsTypes[col]){
				try {
					if (
						// Set value as number if not already
						this.resultsTypes[col] === 'number'
						&& typeof value !== this.resultsTypes[col]
					) {
						value = Number(value);
					}
					
					if (
						// Set value as string if not already
						this.resultsTypes[col] === 'string'
						&& typeof value !== this.resultsTypes[col]
					) {
						value = String(value);
					}
				} catch (e) {
					console.error('Pagination2.__setType',e)
					return value;
				}
			}
		}
		
		return value;
	}
	
	/**
	 * Move to next page if not on last
	 */
	forward(){
		if(this.page < this.__getLastPage()) {
			this.page++;
			
			try {
				this.renderMethod(this.results, ...this.params);
			} catch (e) {
				throw this.__error('Check for assigned this.renderMethod ' + e)
			}
		}
	}
	
	/**
	 * Move back a page if not on first
	 */
	back(){
		if(this.page > 1) {
			this.page--;
			
			try {
				this.renderMethod(this.results, ...this.params);
			} catch (e) {
				throw this.__error('Check for assigned this.renderMethod ' + e)
			}
		}
	}
	
	/**
	 * Go to a specific page
	 * @param page
	 */
	navigate(page){
		if(page <= this.__getLastPage()) {
			this.page = page;
			
			try {
				this.renderMethod(this.results, ...this.params);
			} catch (e) {
				throw this.__error('Check for assigned this.renderMethod ' + e)
			}
		}
	}
	
	/**
	 * Update data pool to work from and reset page to 1
	 * @param data
	 * @param params
	 */
	updateResults(data, params = null){
		this.page = 1;
		this.results = data;
		
		// Replace if valid
		if(params){
			this.params = params;
		}
		
		try {
			this.renderMethod(data, ...this.params);
		} catch (e) {
			throw this.__error('Check for assigned this.renderMethod ' + e)
		}
		
		if(this.useNavigation) {
			this.updateNavigation(data);
		}
	}
	
	/**
	 * Render page options, nav buttons and totals
	 */
	updateNavigation(data) {
		// Target containers		
		const menu = $('.pagination-menu[data-id='+this.id+']');
		
		// Clear existing content
		if (menu.length > 0) {
			menu.remove();
		}
		
		// Set total results
		$('.list-counter .total').html(data.length);
		
		// Skip pagination on empty
		if(data.length < 1) {
			return data;
		}
		
		// Get last page
		const lastPage = this.__getLastPage(data);
		
		//	If there is only one page, dont't add navigation block
		if(lastPage < 2){
			return data;
		}
		
		const pageItems = [];
		
		// If more than 10 pages
		if (lastPage > 10) {
			
			// Current page is greater than 5
			if (this.page > 5) {
				// Set first page
				pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: '1', click: () => this.navigate(1)}));
				pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: '...'}));
				
				let loopEnd = this.page + 3;
				if (loopEnd > lastPage) {
					loopEnd = lastPage;
				}
				
				// Current page within 7 of last page
				let loopStart = this.page - 3;
				if (
					(lastPage - 7) < this.page
					&& this.page > (lastPage - 4)
				) {
					loopStart = loopEnd - 7;
				}
				
				// Build page list
				for (let i = loopStart; i <= loopEnd; i++) {
					pageItems.push($('<button/>', {class:"page-link box" + (this.page === i ? ' active' : ''), type: 'button', html: i, click: () => this.navigate(i)}));
				}
				
				if (loopEnd < lastPage) {
					// Set last page
					if(loopEnd < (lastPage - 1)) {
						pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: '...'}));
					}
					pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: lastPage, click: () => this.navigate(lastPage)}));
				}
			}
			
			// Current page is less than 6
			if (this.page < 6) {
				// Build page list
				for (let i = 1; i <= 8; i++) {
					pageItems.push($('<button/>', {class:"page-link box" + (this.page === i ? ' active' : ''), type: 'button', html: i, click: () => this.navigate(i)}));
				}
				
				// Set last page
				pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: '...'}));
				pageItems.push($('<button/>', {class:"page-link box", type: 'button', html: lastPage, click: () => this.navigate(lastPage)}));
				
			}
		} else {
			// If less than 10 pages
			// Build page list
			for(let i=1; i <= lastPage; i++){
				pageItems.push($('<button/>', {class:"page-link box" + (this.page === i ? ' active' : ''), type: 'button', html: i, click: () => this.navigate(i)}));
			}
		}
		
		
		// Add pagination menu
		const menuWrapper = $('<div/>', {class:"pagination-menu", 'data-id': this.id}).append(
			// Set page wrapper
			$('<div/>', {class:"page-wrapper" + (data.length <= this.limit ? ' hide-page-wrapper' : '')}).append(
				// Back button
				(this.page !== 1 && $('<button/>', {class:"back", html: '<i class="fa-solid fa-angle-left"></i>', click: () => this.back()})),
				// Page list
				$('<div/>', {class: 'page-list'}).append(pageItems),
				// Forward button
				(this.page !== lastPage && $('<button/>', {class:"forward", html: '<i class="fa-solid fa-angle-right"></i>',click: () => this.forward()})),
			),
		);
		
		// Add limiter dropdown to pagination menu
		if(this.showLimiter) {
			menuWrapper.append(
				$('<div/>', {class: "limiter form-item in-line"}).append(
					$('<label/>', {for: 'limitOptions-' + this.id, class: "form-label", html: 'Show:'}),
					$('<select/>', {class: "limit-options", id: "limitOptions-" + this.id, value: this.limit, change: (e) => this.updateLimit(e)}).append(
						this.limitOptions.map((v) => {
							return $('<option/>', {value: v, html: v + ' ' + this.limitText, selected: (v === this.limit)})
						})
					),
				)
			)
		}
		
		try {
			if (this.menuWrapper) {
				// Override default menu location if set
				this.menuWrapper.append(menuWrapper);
			} else if (this.tableWrapper) {
				// Use table wrapper if using tables
				this.tableWrapper.append(menuWrapper);
			} else {
				try {
					// Use wrapper
					this.wrapper.after(menuWrapper);
				} catch (e) {
					console.error('Pagination Error:', 'Check for assigned this.wrapper', e)
				}
			}
		} catch (e) {
			throw this.__error('Check wrapper type ' + e)
		}
	}
	
	/**
	 * Change number of results to show
	 */
	updateLimit(e){
		this.limit = Number($(e.target).val());
		
		// Prevent being stuck on empty page
		this.page = 1;
		
		try {
			this.renderMethod(this.results, ...this.params);
		} catch (e) {
			throw this.__error('Check for assigned this.renderMethod ' + e)
		}
	}
	
	/**
	 * Filter data by page and limit
	 * @param data
	 * @returns {*}
	 */
	filter(data = this.results){
		// Arrays start with 0
		const page = this.page - 1;
		
		const start = page * this.limit;
		const end = start + this.limit;
		
		if(this.useNavigation) {
			this.updateNavigation(data);
		}
		
		return data.slice(start, end);
	}
	
	/**
	 * Update table header on sort
	 * - Arrow down is desc
	 * - Arrow up is asc
	 * @param event
	 * @param field
	 */
	uiSort(event, field){
		// Get sort button
		let button = $(event.target)
		
		// Set as button if child
		if(button.hasClass('fa-solid')){
			button = button.parent();
		}
		
		const wrapper = button.parent().parent();
		
		// Sets the column to sort by its active direction
		let active = button.hasClass('active');
		// When initially set to active use this direction
		let activeDirection = button.data('active-direction');
		// Indicates the current sort direction
		let direction = button.attr('data-direction');		
		
		// Reset active and flip
		wrapper.children().children('.active').children('i').removeClass('fa-caret-up fa-caret-down');
		wrapper.children().children('.active').children('i').addClass('fa-sort');
		wrapper.children().children('.active').removeClass('active');
		
		// Set sort direction
		if(!active){
			direction = activeDirection;			
			button.attr('data-direction', direction)
			
			if(direction === 'asc') {
				button.children('i').removeClass('fa-sort')
				button.children('i').addClass('fa-caret-up')
			} else {
				button.children('i').removeClass('fa-sort')
				button.children('i').addClass('fa-caret-down')
			}
		} else {
			if(direction === 'asc') {
				direction = 'desc';
				button.children('i').removeClass('fa-sort')
				button.children('i').addClass('fa-caret-down')
				button.attr('data-direction', direction)
			} else {
				direction = 'asc';
				button.children('i').removeClass('fa-sort')
				button.children('i').addClass('fa-caret-up')
				button.attr('data-direction', direction)
			}
		}		
		
		// Save to element
		button.addClass('active');		
		
		// Sort data
		this.sort(field, direction);
	}
	
	/**
	 * Sort results by field and direction
	 * @param field
	 * @param direction
	 */
	sort(field, direction){
		try {
			// Sort by name
			this.results.sort((a, b) => {
				
				// Set values to var, convert nulls to 0
				let valueA = a[field] || 0;
				let valueB = b[field] || 0;
				
				// If string convert string to lowercase
				valueA = isNaN(valueA) ? valueA.toLowerCase().trimStart() : valueA;
				valueB = isNaN(valueB) ? valueB.toLowerCase().trimStart() : valueB;
				
				if (direction === 'asc') {
					//	Check if the values are strings
					if (isNaN(valueA) && isNaN(valueB)) {
						// Check if date
						if (
							new Date(valueA).toString() !== 'Invalid Date'
							&& new Date(valueB).toString() !== 'Invalid Date'
						) {
							//	Date Difference
							return new Date(valueA) - new Date(valueB);
						}
						
						//	Not a date, check if the strings are equal
						return valueA.localeCompare(valueB);
					}
					
					//	else assume numeric
					return valueA - valueB;
				} else {
					//	Check if the values are strings
					if (isNaN(valueA) && isNaN(valueB)) {
						// Check if dates
						if (
							new Date(valueA).toString() !== 'Invalid Date'
							&& new Date(valueB).toString() !== 'Invalid Date'
						) {
							//	Date Difference
							return new Date(valueB) - new Date(valueA);
						}
						
						//	Not a date, check if the strings are equal
						return valueB.localeCompare(valueA);
					}
					
					//	else assume numeric
					return valueB - valueA;
				}
			});
		} catch (e) {
			throw this.__error('Sort |' + e);
		}
		
		// Reload results
		this.updateResults(this.results);
	}
	
	/**
	 * Perform search on this.results
	 * - Set matches as false to get results that do not match
	 * @param text
	 * @param matches
	 */
	search(text, matches = true){
		
		let results = [];
		const keys = [];
		
		try {			
			// Set to lowercase
			text = text.toLowerCase();
			
			// Loop through all items and find matching values
			this.results.map((item, index) => {
				Object.values(item).every((value) => {
					
					if (value && typeof value === 'object') {
						// Loop through objects
						return Object.entries(value).every((v) => {
							if (v[0].toLowerCase().indexOf(text) >= 0) {
								results.push(item);
								keys.push(index);
							} else if (v[1].toLowerCase().indexOf(text) >= 0) {
								results.push(item);
								keys.push(index);
							} else {
								return true;
							}
						});
						
					} else {
						// Loop through standard values
						if (value && value.toLowerCase().indexOf(text) >= 0) {
							results.push(item);
							keys.push(index);
						} else {
							return true;
						}
					}
					
				});
			});
			
			// Remove all matching
			if (!matches) {
				results = this.results.filter((v, k) => !keys.includes(k));
			}
			
			// Set to first page to prevent being stuck on an empty page
			this.page = 1;
			
			// Store search results
			this.searches = results;
			
			// Toggle reset button
			if (this.table.search.enabled) {
				// Get button
				const button = this.tableWrapper.children('.table-search').children('.search-reset');
				
				if (text !== '') {
					button.show();
				} else {
					button.hide();
				}
			}
			
		} catch (e) {
			throw this.__error('Search Error ' + e)
		}
		
		// Render with search results		
		try {
			this.renderMethod(results, ...this.params);
		} catch (e) {
			throw this.__error('Check for assigned this.renderMethod ' + e)
		}
	}
	
	/**
	 * Clear searches
	 */
	resetSearch(){
		try {
			// Clear text field
			this.tableWrapper.children('.table-search').children('input').val('');
		} catch (e) {
			throw this.__error(e)
		}
		// Reset search filter
		this.search('');
	}
	
	// --------------------------------
	// Table building
	// --------------------------------
	
	/**
	 * Build default table
	 * - Can take this.table object to render
	 * @param {object | null} table
	 * @type {{
	 * 		title: string|null,
	 * 		mobileTitles: boolean,
	 * 		emptyMessage: string,
	 * 		counter: {
	 * 			enabled: boolean,
	 * 			text: string,
	 * 		}, 
	 * 		search: {
	 * 			enabled: boolean,
	 * 			placeholder: string,
	 * 			class: string,
	 * 		}, 
	 * 		columns: [{
	 * 			title: string, class: string,
	 * 			dataName: string, 
	 * 			sort: {activeDirection: string, active: boolean}, 
	 * 			modifier: {method: function, params: *[]}, 
	 * 		}], 
	 * 	}}
	 */
	buildTable(table = null){
		
		// Initialize table with passed table object
		if(table){			
			// Use defaults when not overridden
			this.table = {
				...this.table,
				...table,
				// Check if null
				counter: {...this.table.counter, ...table.counter},
				search: {...this.table.search, ...table.search},
			};
			this.__initTable();
			return
		}
		
		try {
			// Clear table
			this.tableWrapper.empty();
		} catch (e) {
			throw this.__error(e)
		}
		
		// Add search if enabled
		if(this.table.search && this.table.search.enabled) {
			this.tableWrapper.append(
				$('<div/>', {class: 'table-search mb-3 ' + this.table.search.class}).append(
					$('<i/>', {class: "fa-solid fa-magnifying-glass"}),
					$('<label/>', {for: 'paginationSearch' + this.id, class: "hide"}),
					$('<input/>', {
						type: 'text',
						id: 'paginationSearch' + this.id,
						placeholder: this.table.search.placeholder,
						on: {input: (e) => this.search(e.target.value)}
					}),
					$('<button/>', {class: "search-reset", click: () => this.resetSearch()}).append(
						$('<i/>', {class: "fa-solid fa-x"}),
					),
				),
			)
		}
		
		// Add title wrapper
		if(
			this.table.title 
			|| (this.table.counter && this.table.counter.enabled)
		) {
			this.tableWrapper.append(
				$('<div/>', {class: 'table-title-wrapper mb-3'}).append(
					// Add table title
					$('<h5/>', {class: 'table-title', html: this.table?.title}),
				),
			);
			
			// Add counter if enabled
			if (this.table.counter && this.table.counter.enabled) {
				this.tableWrapper.children('.table-title-wrapper').append($('<div/>', {class: 'table-counter'}));
			}
		}
		
		this.tableWrapper.append(
			// Build table header
			$('<div/>', {class: 'table-header-wrapper'}).append(
				$('<div/>', {class: 'row table-header'}).append(
					this.table.columns.map((column, index) => {
						const active = column.sort?.active ? ' active ' : ' ';
						const activeDirection = column.sort?.activeDirection || 'asc';
						
						// Default for inactive
						let sortArrow = "<i class='fa-solid fa-sort'></i>"
						
						// Set active direction
						if(column.sort?.active) {
							// Store active column info to sort data by on init build
							this.initSort = {field: column.dataName, direction: (column.sort?.activeDirection || 'desc')};
							
							if(this.initSort.direction === 'desc'){
								sortArrow = "<i class='fa-solid fa-caret-down'></i>"
							} else {
								sortArrow = "<i class='fa-solid fa-caret-up'></i>"
							}
						}					
						
						return (
							$('<div/>', {class: (column.class || 'col'), html: column.title}).append(
								$('<button/>', {
									class:"btn-sort" + active, 
									'data-direction': activeDirection,
									'data-active-direction': activeDirection,
									click: (e) => this.uiSort(e, column.dataName), 
									html: sortArrow
								})
							)
						)
					})
				),
			),
			$('<div/>', {class: 'pagination-wrapper table-wrapper'}),
		)
		
		if(this.initSort){
			this.sort(this.initSort.field, this.initSort.direction)
		} else {
			// Build rows
			this.renderMethod();
			
			// Run additional function after rows are rendered
			if(this.postRenderMethod){
				this.postRenderMethod();
			}
		}
	}
	
	/**
	 * PRIVATE Method
	 * Build table rows from this.table.columns and this.results
	 * @private
	 */
	__buildRows(data = this.results) {
		
		// Use search results if available
		if(this.searches.length > 0){
			data = this.searches;
		}
		
		// Update total counter
		if(this.table.counter && this.table.counter.enabled) {
			this.tableWrapper.children('.table-title-wrapper').children('.table-counter').html(data.length + ' ' + this.table.counter.text);
		}
		
		// Filter results
		const results = this.filter(data);
		
		// Empty wrapper
		this.tableWrapper.children('.pagination-wrapper').empty();
		
		if(results.length > 0) {
			this.tableWrapper.children('.pagination-wrapper').append(
				// Return row
				results.map((data, id) => {
					return (
						// Set an id for each row, use id if set otherwise use index id
						$('<div/>', {class: 'row', 'data-id': (data.id ? data.id : id)}).append(
							this.table.columns.map(column => {
								// Get value from data by column dataName
								let value = data[column.dataName]
								let html = '';
								
								// Set value by resultsType if applicable
								if(typeof data[column.dataName] !== "undefined"){
									value = this.__setType(column.dataName, value);
								}
								
								// Check if value type is an object
								if(value && typeof value === 'object'){
									throw this.__error('Invalid value type!');
								}
								
								// Apply modifier
								if(column.modifier){
									// Pass empty params if not set
									if(!column.modifier.params) {
										column.modifier.params = [];
									}
									
									// Apply modifier method
									value = column.modifier.method(value, ...column.modifier.params);
								}
								
								// Apply custom html content
								if(column.html){
									// Replace all {{vars}} with the values from their object
									try {
										html = column.html.replaceAll(/{{(.*?)}}/g,( match, offset) => data[offset]);
									} catch (e){
										console.error('Pagination Error:', 'Check if data name exists in objects', e);
									}
								} else {
									html = value;
								}
								
								// Check if html type is an object after modifications
								if(html && typeof html === 'object'){
									throw this.__error('Invalid value type!');
								}
								
								// Build column
								const col = $('<div/>', {class: column.class, 'data-id': column.dataName, html: html});
								
								// Add mobile only column title
								if(this.table.mobileTitles){
									col.prepend($('<span/>', {class: 'mobile-only', html: column.title}))
								}
								
								return col;
							})
						)
					)
				})
			)
		} else {
			// Return empty message
			this.tableWrapper.children('.pagination-wrapper').append(
				$('<h4/>', {class: 'mt-5 text-center', html: this.table.emptyMessage})
			)
		}
		
		// Run additional function after rows are rendered
		if(this.postRenderMethod){
			this.postRenderMethod();
		}		
	}
	
	// --------------------------------
	// Error handling
	// --------------------------------
	
	/**
	 * PRIVATE Method
	 * Throw new errors
	 * @param message
	 * @returns {Error}
	 * @private
	 */
	__error(message) {
		return new Error('Pagination Error | ' + message);
	}
}
