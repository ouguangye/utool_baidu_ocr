const axios = require('axios');
const fs = require('fs');
const qs = require('querystring');

function getToken() {
    const appID = 'xxxx'
    const secretKey = 'xxxx'
    return axios.get(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${appID}&client_secret=${secretKey}`)
    .then(res=>{
        // console.log(res.data.access_token)
        return res.data.access_token
    }).catch(err=>{
        console.log("err: ", err)
    })
}


function pituresToBase64ThenUrlEncode(image) {
    let bitmap = fs.readFileSync(image);
    let base64str = Buffer.from(bitmap, 'binary').toString('base64'); // base64编码
    return base64str
}

function getText(token, image) {
    return axios({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({"image":image}),
        url:'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=' + token,
    }).then(res=>{
        if(res.data.words_result) {
            return res.data.words_result   
        }
        else {
            console.log(res.data)
        }
    }).catch(err=>{
        console.log("err: ", err)
    })
}

// 这里的main函数作为入口函数使用，方便调试
async function main(imageCode) {
    const token = await getToken()

    if(!imageCode) imageCode = pituresToBase64ThenUrlEncode("test.png")
    
    if (token && imageCode) {
        return getText(token, imageCode)
    }
}

window.exports = {
    "run": { 
        mode: "none",  
        args: {
           // 进入插件应用时调用
           enter: async ({code, type, payload}) => {
                window.utools.hideMainWindow()
                utools.screenCapture(async base64Str => {
                    const words_list = await main(base64Str)
                    console.log(words_list)
                    wordStr = ""
                    words_list.forEach(w=>{
                        wordStr += (w.words + '\n')
                    })
                    if(words_list.length === 0) {
                        utools.showNotification('图片上没有识别出文字')
                        return
                    }
                    if(wordStr !== ''){
                        utools.copyText(wordStr)
                        utools.showNotification('成功复制 ' + wordStr)
                    }
                })
                utools.outPlugin()
           }  
        } 
    }
}