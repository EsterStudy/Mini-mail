window.addEventListener("load", function(){

    //Добавление события на кнопку для полуения токена
    this.document.getElementById('getToken').addEventListener('click',function(){
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://online.sigmasms.ru/api/login', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        var data = JSON.stringify({
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        });

        // успешное получение токена
        xhr.onload = function(){
            if(xhr.status == 200){
                var result = JSON.parse(xhr.responseText);
                document.getElementById('token').value = result.token;
            }
        }
        xhr.send(data);
    });

    // Событие для отправления одного СМС-сообщения
    this.document.getElementById('sendOneSms').addEventListener('click', function(){
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://online.sigmasms.ru/api/sendings', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        var token = document.getElementById('token').value;
        xhr.setRequestHeader("Authorization", token);
        var data = JSON.stringify({
            recipient: "+79000000000",
            type: "sms",
            payload : {
                // убедитесь, что имя отправителя добавлено в компоненты
                sender: "B-Media",
                text: "Hello world!"
            }
        });

        // Успешный ответ
        xhr.onload = function(){
            if(xhr.status == 200){
                var result = JSON.parse(xhr.responseText);
                document.getElementById('messageGuid').value = result.id;
            }
        }
        xhr.send(data);
    });
    
    // получение статуса отправления одного сообщения
    this.document.getElementById('checkStatus').addEventListener('click', function(){
        var xhr = new XMLHttpRequest();

        var messageGuid = document.getElementById('messageGuid').value;
        var url = 'https://online.sigmasms.ru/api/sendings/' + messageGuid;
        xhr.open('GET', url, true);

        // токен авторизации в хэдер запроса
        var token = document.getElementById('token').value;
        xhr.setRequestHeader("Authorization", token);
        
        // результат на успешный ответ
        xhr.onload = function(){
            if(xhr.status == 200){
                var result = JSON.parse(xhr.responseText);
                document.getElementById('smsStatus').value = result.state.status;
            }
        }

        xhr.send();
    });

    // Событие на кнопку для загрузки изображения
    document.getElementById('uploadImage').addEventListener('click', function(){
        
        var reader = new FileReader();

        // результат на успешное прочтение файла
        reader.onload = function(event){
            var xhr = new XMLHttpRequest();
            xhr.open('POST', 'https://online.sigmasms.ru/api/storage/', true);

            var token = document.getElementById('token').value;
            // Авторизация в главном запросе
            xhr.setRequestHeader("Authorization", token);
            // оповещение для прямой загрузки
            xhr.setRequestHeader('Content-Type', 'image/jpeg');
            // успешное получение ответа
            xhr.onload = function(){
                if(xhr.status == 200){
                    var result = JSON.parse(xhr.responseText);
                    document.getElementById('imageId').value = result.key;
                }
            };

            var arrayBuffer = event.target.result;
            xhr.send(arrayBuffer);
        };

        var files =  document.getElementById('image').files;
        if(files.length > 0)
        {
            // прочитать файл
            reader.readAsArrayBuffer(files[0]);
        }
    });

    // масс рассылка
    document.getElementById('sendBulk').addEventListener('click', function(){
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://online.sigmasms.ru/api/sendings', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // авторизация
        var token = document.getElementById('token').value;
        xhr.setRequestHeader("Authorization", token);
        // получение загруженного изображения
        var imageId = document.getElementById('imageId').value;

        var data = JSON.stringify({
            recipient: ["+79000000000", "+79000000001"],
            type: "viber",
            payload:{
                // проверка
                sender: "X-City",
                 // время
                text: "Hello world!" + new Date().toISOString(),
                image: imageId,
                button: {
                    text: "best mailing service",
                    url: "https://sigmasms.ru/"
                }
            },
            // попробуйте через 5 минут снова
            schedule: new Date(new Date().getTime() +  5 * 60000).toISOString(),
            fallbacks: [{
                type: "sms",
                payload: {
                    // убедитесь, что имя отправителя добавлено в компоненты
                    sender: "B-Media",
                    text: "Hello world!" + new Date(new Date().getTime() +  10 * 60000).toISOString()
                },
                "$options": {
                    onTimeout: {
                        timeout: 600,
                        except: ["seen", "delivered"]
                    }
                }
            }]
        });

        // успешное получение ответа
        xhr.onload = function(){
            if(xhr.status == 200){
                var result = JSON.parse(xhr.responseText);
                document.getElementById('groupId').value = result.groupId;
            }
        }
        xhr.send(data); 
    });

    // кнопка проверки статуса массовой рассылки
    document.getElementById('checkBulk').addEventListener('click', function(){
        var groupId = document.getElementById('groupId').value;
        var url = 'https://online.sigmasms.ru/api/sendings/?groupId=' + groupId;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        var token = document.getElementById('token').value;
        // авторизация
        xhr.setRequestHeader("Authorization", token);
        // успешное получени данных
        xhr.onload = function(){
            if(xhr.status == 200){
                var result = JSON.parse(xhr.responseText);

                // все цепочки сообщений и происходила ли переотправка
                var groupedData = (result.data || [])
                .sort(function(a, b){
                    return new Date(a.updatedAt) - new Date(b.updatedAt);
                })
                .reduce(function(g, i){
                    g[i.chainId] = g[i.chainId] || [];
                    g[i.chainId].push({
                        type: i.type,
                        status: i.state.status,
                        createdAt: i.createdAt
                    });
                    return g;
                }, {});

                var beautyJson = JSON.stringify(groupedData, null, "  ");
                document.getElementById('bulkResult').value = beautyJson;
            }
        };
        xhr.send();
    });
});