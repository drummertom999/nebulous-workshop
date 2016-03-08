// *******************************************
//# sourceURL=modules/enginejs-editor.js
// *******************************************

Engine.Editor =
{
	BuildParamEditor : function(shader_object)
	{
		// Parse shader for [EDITOR] blocks
		var shader_params = { }; var match;
		var regex = /uniform float ([^;]*).* \[EDITOR\] (.*)/g;
		while(match = regex.exec(shader_object.code))
		{
			var entry = $.extend({ var_name : match[1] }, eval("(" + match[2] + ")"));
			if(!shader_params.hasOwnProperty(entry.group)) {shader_params[entry.group] = [] }
			shader_params[entry.group].push(entry);
		}

		// Build editor
		var editor = $("<div>", { id : "param_editor" });
		$.each(shader_params, function(group, entries)
		{
			var heading = $("<h2>", { text : group }).appendTo(editor);
			var table   = $("<table>").appendTo(editor);
			for(var i = 0; i < entries.length; ++i)
			{
				var row    = $("<tr>").appendTo(table);
				var call_l = $("<td>", { text : entries[i].label }).appendTo(row);
				var cell_r = $("<td>").appendTo(row);
				var slider = $("<div id='" + entries[i].var_name + "' style='width:200px'/>");
				slider.slider(entries[i]).appendTo(cell_r);
			}
		});
		return editor;
	},

	BindParamEditor : function(param_editor)
	{
		param_editor.find("td div").each(function()
		{
			Engine.Gfx.SetShaderConstant($(this).attr("id"), $(this).slider("value"), Engine.Gfx.SC_FLOAT);
		});
	},
};