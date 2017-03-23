var request = require('request');
var cheerio = require('cheerio');
var $url = require('url');

var insertToTheseSites = [
    // 'http://localhost:8080/wordpress',
    'http://magiangiatot.com',
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
            // console.log(data.coupons)
            console.timeEnd('timeGetCoupons');
            sendCouponsToApi(data)
        }else{
            console.log('Error status code: ', response.statusCode)
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

var getPosts = function (url) {
    request(url, function(error, response, body) {
        if(error) {
            console.log("Error: " + error)
        }
        if(response.statusCode === 200) {
            var data = [];
            var $ = cheerio.load(body);
            if(url.indexOf('offers.vn') > -1 ){
                getPost_offersDotVn($, url)
            }
            console.timeEnd('timeGetPosts');
        }else{
            console.log('Error status code: ', response.statusCode)
        }
    })
};

var getPost_offersDotVn = function ($, url) {
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
};

var getPostDetail_offerDotVn = function (href) {
    // console.time('getPost');
    request(href, function(error, response, body) {
        if(response.statusCode === 200) {
            var post = [];
            var $ = cheerio.load(body);
            post['title'] = $('.entry-title').text();
            $('.yuzo_related_post').remove();
            $('style').remove();
            post['imgs'] = [];
            var domain = $url.parse(href).hostname;
            $('.entry-content img').each(function (i, el) {
                var src = $(this).attr('src');
                if (src.indexOf('facebook') === -1){
                    src = src.replace(/\/wp-content\/uploads/g, 'https://' + domain + '/wp-content/uploads');
                    post['imgs'].push(src)
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
            // console.timeEnd('getPost');
            sendPostToApi(post);
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
            if (!error && response.statusCode == 200) {
                console.log(body)
            }
        })
    }

};

var sendPostToApi = function (post) {
    console.time('addPost');
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
            // console.log(response.statusCode);
            if (!error && response.statusCode == 200) {
                console.log(body);
                console.timeEnd('addPost');
            }

        })
    }
};

// console.time('start')
// console.time('timeGetCoupons')
// console.time('timeResponseFromApi')
console.time('timeGetPosts');

// for(var i = 0;i < arrStoreUrls.length; i++){
//     getCoupons(arrStoreUrls[i])
// }

// Get post blogs
for(var i = 0;i < arrPostsUrl.length; i++){
    getPosts(arrPostsUrl[i]);
}

// test
// getPostDetail_offerDotVn('https://www.offers.vn/thoi-quen-doc-sach/');