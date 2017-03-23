module.exports = {
    getPost_offersDotVn: function () {
        var pages = [];
        // Get number of pages
        $('.archive-pagination li').each(function (i, el) {
            var page = parseInt($(this).text());
            if(page)
                pages.push(page)
        });
        // Get post urls page by page
        var postUrls = [];
        for(var i = 0;i < pages.length; i++){
            var subPage = url + 'page/' + pages[i];
            request(subPage, function(error, response, body) {
                if(error) {
                    console.log("Error: " + error)
                }
                if(response.statusCode === 200) {
                    var data = [];
                    var $html = cheerio.load(body);
                    $html('.type-post').each(function (i, el) {
                        var href = $(this).find('.entry-title a').attr('href');
                        // get post detail
                        getPostDetail_offerDotVn(href);
                    })
                }else{
                    console.log('Error status code: ', response.statusCode)
                }
            })
        }
    },
    bar: function () {
        // whatever
    }
};