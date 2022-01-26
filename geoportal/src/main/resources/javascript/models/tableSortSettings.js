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



OpenGeoportal.TableSortSettings = Backbone.Model.extend({
	  defaults: {
		    column: "score",
		    type: "numeric",
		    direction: "desc"
		  },
		
		  
		  setColumn: function(newColumn){
			  if (newColumn == 'score'){
					this.set({column: "score", direction: "desc"});
			  } else {
				  //if it's a different column, default to direction "asc"
				  if (this.get("column") !== newColumn){
					  this.set({column: newColumn, direction: "asc"});
				  } else {
					  //toggle direction
					  this.toggleDirection();
				  }
			  }
		  },
		  
		  toggleDirection: function(){
			  var newDirection = "desc";
			  if (this.get("direction") == "desc"){
				  newDirection = "asc";
			  }
			  this.set({direction: newDirection});
		  }
	  
		

});
