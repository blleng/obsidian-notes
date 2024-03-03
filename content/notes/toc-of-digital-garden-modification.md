---
date: 2023-08-28T00:36
update: 2024-03-03T12:38
tags:
  - note/2023/08
  - note/frontend
id: note20230828003602
dg-publish: true
maturity: withered
title: Modification of table of contents of digital garden
description: Modify the digital garden for convenient table of contents
---
# Overview
The community plugin `Digital Garden` of Obsidian has a layout that `Table of Content`, `Graph` and `Backlink` modules are all put in the `sidebar` part. It's inconvenient to refer to table of content at mobile devices.
Here, we can apply some modifications to display the `toc` and `fileTree` together in navigation bar, thus it's easy for us to check the table of content at mobile devices.

# Modification Process
## Delete previous toc
Delete `toc` in `sidebar`.

```diff title="src/site/_include/components/sidebar.njk"
- {%if settings.dgShowToc === true%}
- {%set tocHtml= (content and (content\|toc)) %}
- {%if tocHtml %}
- <div class="toc">
- <div class="toc-title-container">
- <div class="toc-title">
- On this page
- </div>
- </div>
- <div class="toc-container">
- {{ tocHtml | safe }}
- </div>
- </div>
- {%endif%}
- {%endif%}
```

## Add toc in file tree
Add codes in `filetree` file.

```diff title="src/site/_include/components/filetree.njk"
 <div class="folder" x-data="{isOpen: true}">
+    <div class="sidebar-nav">
+        <ul>
+            <li class="current">
+                Overview
+            </li>
+            <li>
+                Contents
+            </li>
+        </ul>
+    </div>
+    <div class="sidebar-panel-container">
+        <div class="item" style="display: block;">
+			<div class="site-overview">
	            {% for fileOrFolderName, fileOrFolder in filetree -%}
					{{menuItem(fileOrFolderName, fileOrFolder, 0, fileOrFolderName)}}
	            {% endfor -%}
+	        </div>
+	    </div>
+        {% if settings.dgShowToc === true %}
+        <div class="item">
+	        {%set tocHtml= (content and (content|toc)) %}
+	        {%if tocHtml %}
+            <div class="toc">
+	            <div class="toc-container">
+	                {{ tocHtml | safe }}
+                </div>
+            </div>
+	        {%endif%}
+        </div>
+        {% endif %}
+    </div>
 </div>
```

## Styles of navigation bar
Add some necessary styles.

```css title="src/site/styles/custom-style.scss"
li.current {
    border-bottom: 1px solid;
}

.sidebar-nav li {
    float: left;
    list-style-type: none;
    padding: 0 10px;
    text-align: center;
    cursor: pointer;
    font-size: 14px;
}

.item {
    display: none;
}
```


>[!tip] Important
>The styles here can only provide most basic functions for proper use. You shall modify the file for more elegant display.

## Javascript to control toc
Add necessary `js` code to control toc.

```diff title="src/site/_include/layouts"
	</body>
+	<script>
+	var lis = document.querySelectorAll('div.sidebar-nav li');
+	var items = document.querySelectorAll('.item');
+	for (var i = 0; i < lis.length; i++) {
+	    lis[i].setAttribute('data-index', i);
+	    lis[i].onclick = function () {
+	        for (var i = 0; i < lis.length; i++) {
+	            lis[i].className = '';
+	        }
+	        this.className = 'current';
+	        var index = this.getAttribute('data-index');
+	        for (var j = 0; j < items.length; j++) {
+	            items[j].style.display = 'none';
+	        }
+	        items[index].style.display = 'block';
+	    }
+	}
+	</script>
	</html>
```

# Showcase
![toc1](https://cdn.freezing.cool/images/202308280119703.png)

![toc2](https://cdn.freezing.cool/images/202308280119708.png)
