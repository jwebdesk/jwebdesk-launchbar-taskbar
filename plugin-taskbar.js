define([
    "jwebkit",    
    "jwebdesk",
], function(vapaee, jwebdesk) {
    
    function instalar_plugin(launchbar) {        
        launchbar.add_component("taskbar", {
            "ui_type": "list",
            "class": "horizontal",
            "datapath": "tasks",
            "template": {
                "empty": "",
                "style": "{{#icon_is_src}} style='background-size: contain;background-image:url({{icon_src}});' {{/icon_is_src}}",
                "entry": "<div {{>selected}} {{>minimized}} {{>maximized}} window-id='{{winid}}'><span class='icon size_16 {{icon}}' {{>style}}></span><span class='title'>{{title}}</span></div>",
                "selected": "{{#selected}} selected='true' {{/selected}}",
                "maximized": "{{#maximized}} maximized='true' {{/maximized}}",
                "minimized": "{{#minimized}} minimized='true' {{/minimized}}"
            }
        });

        
        launchbar.set("tasks", new jwk.Collection());
        launchbar.tasks.option("id_attribute", "winid");

        function register_service() {
            var service = vapaee.global.proxy();
            service.register_function({
                foo: function () { }
            });                 
            jwebdesk.register_service("taskbar", service);
        }
        
        jwebdesk.wait_service("window-manager").done(function (win_manager) {
                        
            launchbar.on("change:structure", function () {
                var taskbar = launchbar.structure.search("taskbar");
                taskbar.on("click:entry", function (n,e) {
                    // console.log("-------------------------");
                    var winid = e.which("window-id");
                    if (!winid) return this;
                    var win = launchbar.tasks.get(winid);
                    if (win) {
                        if (win.get("selected")) {
                            if (win.get("minimized")) {
                                win_manager.restore(winid);
                            } else {
                                win_manager.minimize(winid);
                            }                            
                        } else {                            
                            win_manager.select(winid);
                            if (win.get("minimized")) win_manager.restore(winid);
                        }
                    }
                });
            })
            
            win_manager.on("all", function (n,e){
                // console.error(arguments);
            })
            function window_select_handler(n,e){
                // console.log(launchbar.tasks.get(e.window));
                launchbar.tasks.each(function (entry) {
                    entry.set("selected", entry.winid == e.window);
                });
                launchbar.tasks.get(e.window).set("selected", true);
                
                // HACK (*)
                // Se cambió la jwk de manera de que no propague el evento a los padres de un objeto
                // Eso hace que si se cambia una instancia dentro de una collection la collection no se entera y no dispara el evento change
                // por eso es necesario gatillarlo manualmente para que se haga un repaint del taskbar
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            }
            win_manager.on("window:select", window_select_handler);
            function window_open_handler(n,e){
                launchbar.tasks.set(e.window, {
                    winid: e.window,
                    title: e.title,
                    icon: e.icon ? "none" : "default",
                    icon_src: e.icon ? e.icon : null,
                    icon_is_src: e.icon ? true : false,
                    selected: false
                });                
                win_manager.min_mode(e.window, {
                    mode: "taskbar",
                    position: {
                        my: "left top",
                        at: "left top",
                        of: "[window-id='"+e.window+"']"
                    }                    
                });
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            }
            win_manager.on("window:open", window_open_handler)
            win_manager.on("window:close", function (n,e){
                // console.log("window:close");
                launchbar.tasks.unset(e.window);
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            })
            win_manager.on("window:minimize", function (n,e){
                launchbar.tasks.get(e.window).set("minimized", true);
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            })
            win_manager.on("window:maximized", function (n,e){
                launchbar.tasks.get(e.window).set("minimized", true);
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            })
            win_manager.on("window:restore", function (n,e){
                launchbar.tasks.get(e.window).set("minimized", false);
                launchbar.tasks.get(e.window).set("maximized", false);
                launchbar.trigger_fast("change:tasks", {});  // <<<------- HACK (*)
            });
            win_manager.list().done(function (list) {            
                launchbar.tasks.reset();
                for (var i in list) {
                    var win = list[i];
                    if (win.category == "app") {
                        window_open_handler("", win);
                        window_select_handler("", win);
                    }
                    
                }
            })
            register_service();
        });         
    }
    
    
    
    jwebdesk.wait_app("jwebdesk~jwebdesk-launchbar@alpha-0.5").done(function (proxy) {
        instalar_plugin(proxy.instance)
    });
    
});