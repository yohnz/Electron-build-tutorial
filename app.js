var $ = require("jquery");
var num = 0;
var content = [];
var scrollTop = 0;
getData();

$("#list").on("click", ".title_wrap", function () {
	var _index = $(this).data("index");
	var title = $(this).attr("title");
	var page = `<h1>${title}</h1>
				${content[_index]}
				`
	$("#list").hide();
	$(".content").html(page).css("transform", "translateX(0)");
	$(".close_btn").show();
});

$(".close_btn").on("click", function () {
	$(this).hide();
	$(".content").css("transform", "translateX(100%)");
	$("#list").show();
})

function getData() {
	var list = "";
	num += 10;
	scrollTop = 140 * num;
	$.get('https://zhuanlan.zhihu.com/api/recommendations/posts?limit=' + num + '&offset=0&seed=6', function (result) {
		for (var i = 0; i < result.length; i++) {
			var data = result[i];
			content.push(data.content);
			var titleImg = data.titleImage ? `<img class="title_image" src="${data.titleImage}" />` : "";
			list += `<li>
						${titleImg}
						<a class="title_wrap" data-index="${i}" title="${data.title}">
							<h3>${data.title}</h3>
							<div>${data.summary.replace(/<[^>]*>/g, "")}</div>
						</a>
					</li>`
		}
		$("#list").append(list);
	})
}

$(document).scroll(function () {
	var _scrollTop = $(document).scrollTop();
	if (_scrollTop > scrollTop) {
		getData();
	}
})