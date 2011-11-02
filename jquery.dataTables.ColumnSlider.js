/*	Author: Brendan Sullivan <brendan.sullivan@cdlweb.net>
		
		Title:	This plugin adds a slider bar to the DataTable allowing
						the user to hide columns in a given range. It respects
						any columns the programmer may have set to hidden and
						will not show them, even if it is affecting other
						columns on either side of a hidden column
		
		sDom Signature: V

		Usage:	Add the 'V' to sDom where you like it. I like:
								sDom: '<"H"lfr>Vt<"F"ip>'
						which is the basic jQuery layout, with the slider
						positioned directly above the table, inside the other 
						DataTables UI elements.
						
		Configuration:
						There is not much to configure for this plugin. You can
						override the sliderDefaults by including an oCVS object
						in the dataTables initialization:
								$(example).dataTable({
									sDom: '<"H"lfr>Vt<"F"ip>',
									oCVS: { //put custom settings here }
								});

						Fair warning: Anything other than the defaults right now
						will /definitely/ break things.

		Change Log:
						11/2/2011 - Added CSS rules to give the slider a bit of 
												room in the UI
*/

(function ($) {
	var ColumnVisibilitySlider = function (oDataTable) {
		var me = this;
		me.DT = oDataTable;
		me.inOperation = false;
		me.aiInitialVisibleColumns = [];
		this.getVisibleColumnsInDataTable();

		me.aiVisibleColumns = [];
		me.$WidgetContainer = $('<div class="columnSlider"></div>');

		me.sliderDefaults = {
			range: true,
			min: 0,
			max: me.aiInitialVisibleColumns.length - 1,
			values: [0, me.aiInitialVisibleColumns.length - 1],
			start: function () {
				me.inOperation = true;
			},
			slide: function (e, ui) {
				me.setVisibleColumnsInDataTable(ui.values[0], ui.values[1]);
			},
			stop: function () {
				me.inOperation = false;
			}
		}
		if ('oCVS' in oDataTable.oInit) {
			$.extend(sliderDefaults, oDataTable.oInit.oCVS);
		}

		me.$WidgetContainer.slider(me.sliderDefaults).css({
			margin: '.5em 1em'
		});

		/*
		We are going to keep the "old" version of fnSetColumnVis around 
		as we still need it. But we need to intercept all calls to it from
		other parts of the application so we can handle resetting the slider
		and manage our cache of visible columns correctly.
		*/
		oDataTable.oInstance._oldColumnVis = oDataTable.oInstance.fnSetColumnVis;
		oDataTable.oInstance.fnSetColumnVis = function (iCol, bShow, bRedraw) {
			me.$WidgetContainer.slider('values', 0, 0);
			me.$WidgetContainer.slider('values', 1, me.aiInitialVisibleColumns.length - 1);
			me.setVisibleColumnsInDataTable(0, me.aiInitialVisibleColumns.length - 1);
			var iIndex = $.inArray(iCol, me.aiInitialVisibleColumns)
			if (iIndex > -1 && bShow === false) {
				me.aiInitialVisibleColumns.splice(iIndex, 1);
			}
			else if (iIndex == -1 && bShow === true) {
				me.aiInitialVisibleColumns.push(iCol);
			}
			me.aiInitialVisibleColumns.sort(me.sortNumber);
			me.sliderDefaults.max = me.aiInitialVisibleColumns.length - 1;
			me.$WidgetContainer.slider('destroy').slider(me.sliderDefaults).css({
				margin: '.5em 1em'
			});
			this._oldColumnVis(iCol, bShow, bRedraw);
		}

		return me;
	}

	ColumnVisibilitySlider.prototype.getContainer = function () {
		return this.$WidgetContainer;
	}

	ColumnVisibilitySlider.prototype.setVisibleColumnsInDataTable = function (minVis, maxVis) {
		for (var i = 0; i < this.aiInitialVisibleColumns.length; i++) {
			this.inOperation = true;
			if (i < minVis || i > maxVis) {
				this.DT.oInstance._oldColumnVis(this.aiInitialVisibleColumns[i], false);
			} else {
				this.DT.oInstance._oldColumnVis(this.aiInitialVisibleColumns[i], true);
			}
		}
	}

	ColumnVisibilitySlider.prototype.getVisibleColumnsInDataTable = function () {
		this.aiInitialVisibleColumns = [];
		for (var i = 0; i < this.DT.aoColumns.length; i++) {
			if (this.DT.aoColumns[i].bVisible) {
				this.aiInitialVisibleColumns.push(i);
			}
		}
	}

	ColumnVisibilitySlider.prototype.sortNumber = function (a, b) {
		return a - b;
	}

	//feature test
	if (!('slider' in $())) { throw "jQueryUI Slider is required"; }

	if (typeof $.fn.dataTable === 'function' && typeof $.fn.dataTableExt.fnVersionCheck === 'function' && $.fn.dataTableExt.fnVersionCheck('1.8.0')) {
		$.fn.dataTableExt.aoFeatures.push({
			sFeature: 'ColumnVisibilitySlider',
			cFeature: 'V',
			fnInit: function (oDataTable) {
				var oWidget = new ColumnVisibilitySlider(oDataTable);
				return oWidget.getContainer().get(0);
			}
		});
	}
})(jQuery)

