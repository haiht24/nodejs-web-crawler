var request = require('request');
var cheerio = require('cheerio');
var _url = require('url');
var rp = require('request-promise');

var insertToTheseSites = [
    'http://localhost:8080/wordpress',
    // 'http://magiangiatot.com',
    // 'http://magiamgiatot.top'
];

var arrStoreUrls = [
    'https://www.offers.vn/ma-giam-gia-adayroi',
    'https://www.offers.vn/ma-giam-gia-lazada/',
    'https://www.offers.vn/ma-giam-gia-tiki/',
    'https://www.offers.vn/ma-giam-gia-mytour-dat-phong-khach-san/',
    'https://www.offers.vn/ma-giam-gia-sendo/',
    'https://www.offers.vn/ma-giam-gia-zalora/',
    'https://www.offers.vn/ma-giam-gia-yes24/',

    'https://giutcoupon.com/ma-giam-gia-lazada-coupon-lazada/',
    'https://giutcoupon.com/magiamgiazalora/',
    'https://giutcoupon.com/ma-giam-gia-adayroi-den-20-khuyen-mai-thang-012017-tren-adayroi/',
    'https://giutcoupon.com/ma-giam-gia-tiki-coupon-tiki-voucher-tiki-khuyen-mai-moi-nhat-2017/',
    'https://giutcoupon.com/ma-giam-gia-fpt/',

    'https://magiamgia.com/voucher-lazada-khuyen-mai/',
    'https://magiamgia.com/ma-giam-gia-zalora/',
    'https://magiamgia.com/ma-giam-gia-adayroi/',
    'https://magiamgia.com/ma-giam-gia-uber/',
    'https://magiamgia.com/ma-giam-gia-fpt/',
    'https://magiamgia.com/ma-giam-gia-mytour/',
    'https://magiamgia.com/ma-giam-gia-tiki/'
];

var arrPostsUrl = ['https://www.offers.vn/kinh-nghiem/'];

var getCoupons = function (url) {
    request(url, function(error, response, body) {
        if(error) {
            console.log("Error: " + error)
        }
        if(response.statusCode === 200) {
            var data = [];
            var $ = cheerio.load(body);
            if(url.indexOf('offers.vn') > -1 ){
                data = getCoupons_OffersDotVn($, url)
            }else if(url.indexOf('giutcoupon.com') > -1 || url.indexOf('magiamgia.com') > -1){
                data = getCoupons_MaGiamGiaDotCom($, url)
            }
            console.log(data.coupons)
            // sendCouponsToApi(data);
        }else{
            console.log('Error status code: ', response.statusCode);
        }
    })
};

// Get coupons from offers.vn
var getCoupons_OffersDotVn = function ($, url) {
    var extractExpireDate = function ($str) {
        var expire = $str.match(/(.*)([0-9]{2}\/[0-9]{1,2}\/[0-9]{2,4})(.*)/);
        if(expire != null){
            expire = expire[2];
            var temp = expire.split('/'); // dd/mm/YYYY
            expire = temp[2] + '/' + temp[1] + '/' + temp[0]; // YYYY/mm/dd
        } else
            expire = '';
        return expire
    };
    var response = {
        coupons: []
    };
    if(url.indexOf('lazada') > -1)
        response['storeName'] = 'Lazada';
    else if(url.indexOf('adayroi') > -1)
        response['storeName'] = 'Adayroi';
    else if(url.indexOf('tiki') > -1)
        response['storeName'] = 'Tiki';
    else if(url.indexOf('mytour') > -1)
        response['storeName'] = 'MyTour';
    else if(url.indexOf('sendo') > -1)
        response['storeName'] = 'Sendo';
    else if(url.indexOf('zalora') > -1)
        response['storeName'] = 'Zalora';
    else if(url.indexOf('yes24') > -1)
        response['storeName'] = 'Yes24';

    // loop box coupon
    if(url.indexOf('mytour') > -1 || url.indexOf('sendo') > -1){ // special crawl for store mytour and sendo
        $('.coupon1').each(function (i, el) {
            var arr = [];
            var t = $(this);
            arr['title'] = t.find('#H_1').text().trim();
            var desc1 = t.find('#P_1').text();
            var desc2 = t.find('#P_2').text();
            arr['description'] = desc1 + desc2;
            arr['expire'] = extractExpireDate(arr['description']);
            arr['description'] = arr['description'].replace('Hạn dùng: Chưa xác đinh', '').trim();
            arr['description'] = arr['description'].replace('Hết Hạn: Chưa xác định', '').trim();
            arr['code'] = t.find('.coupon-code').text();
            arr['source'] = url;
            response.coupons.push(arr)
        })
    }else{
        $('.coupondiv').each(function (i, el) {
            var arr = [];
            var t = $(this);
            arr['title'] = t.find('.coupontitle').text().trim();
            arr['description'] = t.find('.cpinfo').text();
            arr['expire'] = extractExpireDate(arr['description']);
            arr['description'] = arr['description'].replace('Hạn dùng: Chưa xác đinh', '').trim();
            arr['description'] = arr['description'].replace('Hết Hạn: Chưa xác định', '').trim();
            arr['code'] = t.find('.coupon-code').text();
            arr['source'] = url;
            response.coupons.push(arr)
        })
    }

    return response
};

var getCoupons_MaGiamGiaDotCom = function ($, url) {
    var extractExpireDate = function ($str) {
        if($str.indexOf('Không xác định') > -1)
            return '';
        if($str.indexOf('Không Xác Định') > -1)
            return '';
        var data = $str.match(/(.*)([0-9]{2}\/[0-9]{1,2})(.*)/);
        if(!data)
            return $str;

        var d = new Date();
        $str = data[0] + '/' + d.getFullYear();
        var temp = $str.split('/'); // dd/mm/YYYY
        return temp[2] + '/' + temp[1] + '/' + temp[0]; // YYYY/mm/dd
    };
    var response = {
        coupons: []
    };

    if(url.indexOf('lazada') > -1)
        response['storeName'] = 'Lazada';
    else if(url.indexOf('adayroi') > -1)
        response['storeName'] = 'Adayroi';
    else if(url.indexOf('tiki') > -1)
        response['storeName'] = 'Tiki';
    else if(url.indexOf('mytour') > -1)
        response['storeName'] = 'MyTour';
    else if(url.indexOf('sendo') > -1)
        response['storeName'] = 'Sendo';
    else if(url.indexOf('zalora') > -1)
        response['storeName'] = 'Zalora';
    else if(url.indexOf('yes24') > -1)
        response['storeName'] = 'Yes24';
    else if(url.indexOf('fpt') > -1)
        response['storeName'] = 'FPT';
    else if(url.indexOf('uber') > -1)
        response['storeName'] = 'Uber';

    // loop box coupon
    $('.mgg-list-mgg-item').each(function (i, el) {
        var arr = [];
        var t = $(this);
        arr['title'] = t.find('.mgg-list-mgg-title').text().trim();
        arr['description'] = t.find('.mgg-item-note').text();
        arr['expire'] = t.find('.mgg-item-expires').text();
        arr['expire'] = arr['expire'].replace('Hạn dùng: ', '').trim();
        arr['expire'] = extractExpireDate(arr['expire']);
        arr['code'] = t.find('.mgg-code-text').text();
        arr['source'] = url;
        response.coupons.push(arr)
    });
    return response
};

// 1
var getPosts = function (url) {
    request(url, function(error, response, body) {
        if(error) {
            console.log("Error: " + error);
        }
        if(response.statusCode === 200) {
            var $ = cheerio.load(body);
            if(url.indexOf('offers.vn') > -1 ){
                getPost_offersDotVn($, url);
            }
        }else{
            console.log('Error status code: ', response.statusCode)
        }
    })
};

// 2
var getPost_offersDotVn = function ($, url) {
    var pages = [];
    // Get number of pages
    $('.archive-pagination li').each(function (i, el) {
        var page = parseInt($(this).text());
        if(page)
            pages.push(page)
    });
    // Get post urls page by page
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
};
// 3
var getPostDetail_offerDotVn = function (href) {
    request(href, function(error, response, body) {
        if(response.statusCode === 200) {
            var post = [];
            var $ = cheerio.load(body);
            post['title'] = $('.entry-title').text();
            $('.yuzo_related_post').remove();
            $('style').remove();
            post['imgs'] = [];
            var domain = _url.parse(href).hostname;
            $('.entry-content img').each(function (i, el) {
                var src = $(this).attr('src');
                if (src.indexOf('facebook') === -1){
                    src = src.replace(/\/wp-content\/uploads/g, 'https://' + domain + '/wp-content/uploads');
                    post['imgs'].push(src);
                }
            });
            var content = $('.entry-content').html();
            // remove href from link
            content = content.replace(/<a href=\"(.*?)\">(.*?)<\/a>/g, '');
            //remove attribute Srcset
            content = content.replace('/srcset=\"(.*?)\"/', '');
            // remove style tag
            content = content.replace(/<style>(.*?)<\/style>/g, '');
            content = content.replace(/width:(.*?)\"/g, '');
            content = content.replace(/width=\"(.*?)\"/g, 'width="100%"');
            post['content'] = content.replace(/\/wp-content\/uploads/g, 'https://' + domain + '/wp-content/uploads');
            post['postmeta'] = {
                post_source: href
            };

            // console.log(post);
            // sendPostToApi(post);
            // arrPosts.push(post);
        }else{
            console.log('Error status code: ', response.statusCode);
        }
    })
};

var sendCouponsToApi = function (arrCoupons) {
    var data = {
        action: 'api_add_coupon', // require
        arrCoupons: arrCoupons
    };
    // Set the headers
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    // Configure the request
    for(var i = 0; i < insertToTheseSites.length; i++){
        var $url = insertToTheseSites[i] + '/wp-admin/admin-ajax.php';
        var options = {
            url: $url,
            method: 'POST',
            headers: headers,
            form: data
        };
        // Start the request
        request(options, function (error, response, body) {
            if (response.statusCode === 200) {
                console.log(body);
            }else{
                console.log(response.statusCode);
            }
        })
    }

};

// 4
var sendPostToApi = function (post, index) {
    var data = {
        action: 'api_add_post',
        post: post
    };
    // Set the headers
    var headers = {
        'User-Agent': 'Super Agent/0.0.1',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    // Configure the request
    for(var i = 0; i < insertToTheseSites.length; i++){
        var $url = insertToTheseSites[i] + '/wp-admin/admin-ajax.php';
        var options = {
            url: $url,
            method: 'POST',
            headers: headers,
            form: data
        };
        // Start the request
        request(options, function (error, response, body) {
            console.timeEnd('sendPost_'+index);
            console.log('-----------------------------------------------------------------------');
            if (response.statusCode === 200) {
                console.log('response of request ' + index, body);
            }else{
                console.log('response of request ' + index, response.statusCode);
            }
        })
    }
};

// for(var i = 0;i < arrStoreUrls.length; i++){
//     getCoupons(arrStoreUrls[i])
// }

// Get post blogs
// for(var i = 0;i < arrPostsUrl.length; i++){
//     getPosts(arrPostsUrl[i]);
// }

var runGetPost = function () {
    var arrQueriesPosts = [];
    for(var i = 0; i<arrPostsUrl.length; i++){
        var queryPost = rp(url = arrPostsUrl[i])
            .then(function (body) {
                var $ = cheerio.load(body);
                if(url.indexOf('offers.vn') > -1 ){
                    // Get number of pages
                    var pages = [];
                    $('.archive-pagination li').each(function (i, el) {
                        var page = parseInt($(this).text());
                        if(page)
                            pages.push(page)
                    });
                    // Get post urls page by page
                    var queryPostUrls = [];
                    var ListPostUrls = [];
                    for(var i = 0;i < pages.length; i++){
                        var subPage = url + 'page/' + pages[i];
                        var getListPostUrls = rp(subPage).then(function (body) {
                            var $ = cheerio.load(body);
                            $('.type-post').each(function (i, el) {
                                var href = $(this).find('.entry-title a').attr('href');
                                ListPostUrls.push(href);
                            })
                        });
                        queryPostUrls.push(getListPostUrls);
                    }

                    var queryPostDetail = [];
                    var arrPosts = [];
                    Promise.all(queryPostUrls)
                        .then(function() {
                            // console.log(ListPostUrls);
                            for(var i = 0;i < ListPostUrls.length; i++){
                                var getPostDetail = rp(href = ListPostUrls[i]).then(function (body) {
                                    var $ = cheerio.load(body);
                                    var post = [];
                                    post['title'] = $('.entry-title').text();
                                    $('.yuzo_related_post').remove();
                                    $('style').remove();
                                    post['imgs'] = [];
                                    var domain = _url.parse(href).hostname;
                                    $('.entry-content img').each(function (i, el) {
                                        var src = $(this).attr('src');
                                        if (src.indexOf('facebook') === -1){
                                            src = src.replace(/\/wp-content\/uploads/g, 'https://' + domain + '/wp-content/uploads');
                                            post['imgs'].push(src);
                                        }
                                    });
                                    var content = $('.entry-content').html();
                                    // remove href from link
                                    content = content.replace(/<a href=\"(.*?)\">(.*?)<\/a>/g, '');
                                    //remove attribute Srcset
                                    content = content.replace('/srcset=\"(.*?)\"/', '');
                                    // remove style tag
                                    content = content.replace(/<style>(.*?)<\/style>/g, '');
                                    content = content.replace(/width:(.*?)\"/g, '');
                                    content = content.replace(/width=\"(.*?)\"/g, 'width="100%"');
                                    post['content'] = content.replace(/\/wp-content\/uploads/g, 'https://' + domain + '/wp-content/uploads');
                                    post['postmeta'] = {
                                        post_source: href
                                    };
                                    arrPosts.push(post);
                                });
                                queryPostDetail.push(getPostDetail);
                            }
                        })
                        .then(function () {
                            Promise.all(queryPostDetail).then(function() {
                                console.log('Posts found:' + arrPosts.length);
                                console.time('sendToApi');

                                var interval = 3 * 1000; // 1 seconds;
                                for(var i = 0;i < arrPosts.length; i++){
                                    setTimeout( function (i) {
                                        console.log('Send post ', i);
                                        console.time('sendPost_'+i);
                                        sendPostToApi(arrPosts[i], i);
                                    }, interval * i, i);
                                }

                            })
                        });
                }
            })
            .catch(function (err) {
                // Crawling failed...
                console.log(err);
            });
        arrQueriesPosts.push(queryPost);
    }
    Promise.all(arrQueriesPosts).then(function () {
        console.log('done');
    })
};
runGetPost();