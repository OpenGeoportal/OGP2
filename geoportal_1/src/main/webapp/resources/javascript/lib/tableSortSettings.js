/**
 * This javascript module maintains state for how the table is sorted
 * 
 * @author Chris Barnett
 * 
 */

if (typeof OpenGeoportal == 'undefined'){
	OpenGeoportal = {};
} else if (typeof OpenGeoportal != "object"){
	throw new Error("OpenGeoportal already exists and is not an object");
}

/**
 * TableSortSettings
 * this object maintains state for sort order
 * 
 */
OpenGeoportal.TableSortSettings = function TableSortSettings(){
	
	//really only applies to search results table
			//set some defaults
			this.settings = {"organizeBy": "score", "organizeType": "numeric", "organizeDirection": "desc"};
			//we only need organizetype if there is more than one possibility per column
			//get the current sort state
			this.getState = function(){
				return this.settings;
			};

			this.compareState = function(key){
				if (updateObj[key] == innerThat.settings[key]){
					return true;
				} else {
					return false;
				}
			};
			
			this.setSortColumn = function(){
				//test for rank first
				var newColumn = updateObj.organizeBy;

				analytics.track("Change Results Sort Order", newColumn);

				if (newColumn == 'score'){
					innerThat.settings.organizeBy = newColumn;
					innerThat.settings.organizeType = "numeric";
				} else {
					for (var columnName in tableHeadings){
						if (newColumn == columnName){
							var newOrganize = columnName.organize;
							if (newOrganize){
								throw new Error("This column cannot be organized."); //you can't organize this column
							} else {
								innerThat.settings.organizeBy = newColumn;
								innerThat.settings.organizeType = newOrganize;
								return;
							}
						}
					}
					throw new Error("The specified column name does not exist."); //if it gets here, this means that there was no matching column name in tableHeadings
				}
			};

			this.setSortDirection = function(){
				if (typeof updateObj.organizeDirection == 'undefined'){
					updateObj.organizeDirection = innerThat.settings.organizeDirection;
				}
				if ((updateObj.organizeDirection == 'asc')||(updateObj.organizeDirection == 'desc')){
					innerThat.settings.organizeDirection = updateObj.organizeDirection;
				} else {
					throw new Error("The specified sort direction is invalid for this column."); //invalid organize direction type
				}
			};

			//set the state
			this.setState = function(updateObj){//can't directly set organizeType; this will be looked up in tableHeading
				//test to see if the state is changed; if so, fire new solr search
				if (typeof updateObj.organizeBy == 'undefined'){
					if (typeof updateObj.organizeDirection == 'undefined'){
						//these values can't both be unspecified
						throw new Error("Must specify a column and/or direction.");
					} else {
						//set organizeBy to current value, continue processing
						updateObj.organizeBy = this.settings.organizeBy;
						this.setSortColumn();
						this.setSortDirection();
						//TODO: trigger event to fire search request
						//that.searchRequest(0);
						jQuery(document).trigger("view.updateSortMenu");
					}
				} else if (compareState('organizeBy')){
					if (compareState('organizeDirection')){
						//don't do anything...the object hasn't changed exit function
						return;
					} else {
						this.setSortDirection();
						//that.searchRequest(0);
						jQuery(document).trigger("view.updateSortMenu");
					}
				} else {
					this.setSortColumn();
					this.setSortDirection();
					//that.searchRequest(0);
					jQuery(document).trigger("view.updateSortMenu");
				}
			};
			
};
			