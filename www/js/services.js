angular.module('app.services', [])

.service('AuctionService', function () {
    this.getPreviousAuctions = function(){
        var previousAuctions = window.localStorage.flowers_auctions ? JSON.parse(window.localStorage.flowers_auctions) : [];
        return previousAuctions;        
    }
    
    this.addPreviousAuction = function(auction){
        var AuctionService = this;
        var previousAuctions = AuctionService.getPreviousAuctions();
        if (previousAuctions.length > 30){previousAuctions.shift();}
        previousAuctions.push(auction);
        AuctionService.savePreviousAuctions(previousAuctions);
        return previousAuctions;
    }
    
    this.savePreviousAuctions = function(auctions){
        window.localStorage.flowers_auctions = JSON.stringify(auctions);
    };
    
    this.removePreviousAuction = function(id){
        var AuctionService = this;
        var previousAuctions = AuctionService.getPreviousAuctions();
        for (var index in previousAuctions){
            if (previousAuctions[index].id === id){
                previousAuctions.splice(index, 1);
                AuctionService.savePreviousAuctions(previousAuctions);
                return;
            }
        }
    }
    
    
    this.clearPreviousAuctions = function(){
        window.localStorage.flowers_auctions = [];
    }     
})



.service('OdooService', function ($http, $q, WEB_API_URL) {
    this.login = function(username, password){
        var deferred = $q.defer();
        $http.post(WEB_API_URL + '?login=true' + 
        '&username=admin' +
        '&password=admin').  
        then(function(response) {
            if (response.data.result === true && response.data.data.result.uid){
                window.localStorage.user = JSON.stringify(response.data.data.result);
                deferred.resolve(response.data);
            }
            else{deferred.reject(response);}
            }, function(response) {
                deferred.reject(response);
            });
        return deferred.promise;             
    }
  
    
    this.logout = function(username, password){
        var deferred = $q.defer();
        window.localStorage.user = null;
        deferred.resolve();
        return deferred.promise;             
    }   

    this.getUser = function(){
        return window.localStorage.user ? JSON.parse(window.localStorage.user) : null;
    }
    
    this.getAllData = function(type, page, limit, order){
        var offset = page*limit - limit;
        var deferred = $q.defer();
        var OdooService = this;
        var user = OdooService.getUser();
        console.log(user);
        console.log(order);
        var orderArray = order.split("-");
        order = orderArray.length > 1 ? order = orderArray[1] + " DESC" : order = orderArray[0] + " ASC";
        console.log(order);
        var query = '?records=true' +        
        '&model=' + type + 
        '&offset=' + offset +
        '&limit=' + limit + 
        '&order=' + order + 
        '&sessionid=' + user.session_id;


        $http.post(WEB_API_URL + query).  
        then(function(response) {
            console.log(response);
            if (response.data.result === true){
                //deferred.resolve({"count":testData.count,"data":testData.data.slice(page*limit - limit,page*limit)});
                deferred.resolve(response.data.data);
            }
            else{deferred.reject(response);}
            }, function(response) {
                deferred.reject(response);
            });
        return deferred.promise;             
    };  
    
    
    this.searchData = function(type, page, field, search, limit, order){
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;             
    };   
    
    
    this.getData = function(type, ids, fields){
        var OdooService = this;
        var user = OdooService.getUser();
        var deferred = $q.defer();
        $http.post(WEB_API_URL, {records:true,single:[ids,fields], model:type, sessionid:user.session_id})
        .then(function(response) {
            console.log(response);
            if (response.data.result === true){
                deferred.resolve(response.data.data.result);
            }
            else {
                deferred.reject(response);
            }
            }, function(response) {
                console.log(response);
                deferred.reject(response);
            });
        
        return deferred.promise;             
    };   
    this.addData = function(type,data, partnerid){
        console.log(data);
        var OdooService = this;
        var user = OdooService.getUser();
        data["partner_id"] = partnerid;
        var deferred = $q.defer();
        $http.post(WEB_API_URL, {records:true,create:true, model:type, args:data, sessionid:user.session_id})
        .then(function(response) {
            console.log(response);
            deferred.resolve(response);
            }, function(response) {
                console.log(response);
                deferred.reject(response);
            });
        
        return deferred.promise;          
    };
    this.removeData = function(type, ids){
        var OdooService = this;
        var user = OdooService.getUser();
        var deferred = $q.defer();
        $http.post(WEB_API_URL, {records:true,delete:true,model:type, args:ids, sessionid:user.session_id})
        .then(function(response) {
            console.log(response);
            deferred.resolve(response);
            }, function(response) {
                console.log(response);
                deferred.reject(response);
            });
        return deferred.promise;          
    };
    this.updateData = function(type, ids, data, kwargs){
        console.log(data);
        var OdooService = this;
        var user = OdooService.getUser();
        var deferred = $q.defer();
        $http.post(WEB_API_URL, {records:true,update:true, model:type, args:{ids:ids,data:data}, kwargs:kwargs, sessionid:user.session_id})
        .then(function(response) {
            console.log(response);
            deferred.resolve(response);
            }, function(response) {
                console.log(response);
                deferred.reject(response);
            });
        
        return deferred.promise;         
    };
    
    this.changeState = function(type, state, id){
        var OdooService = this;
        var user = OdooService.getUser();
        var deferred = $q.defer();
        $http.post(WEB_API_URL, {records:true,state:state, model:type, args:{id:id}, sessionid:user.session_id})
        .then(function(response) {
            console.log(response);
            deferred.resolve(response);
            }, function(response) {
                console.log(response);
                deferred.reject(response);
            });
        
        return deferred.promise;          
    }
    
    this.createInvoice = function(order){
        //create invoice -> get id -> change status of order ->validate invoice
        console.log(order);
        var deferred = $q.defer(),
        OdooService = this,
        user = OdooService.getUser(),
        lineItems = [],
        orderId = order.orderid;
        OdooService.getData("sale.order.line", order.order_line,["sequence","delay","state","th_weight","product_packaging","product_id","name","product_uom_qty","product_uom","product_uos_qty","product_uos","route_id","price_unit","tax_id","discount","price_subtotal"]).then(function(data){
            console.log(data);
            lineItems = data;
            var invoiceLineItems = [];
            for (var index in lineItems){
                var line = lineItems[index];
                invoiceLineItems.push({"advance_payment_method":"all","qtty":line.product_uom_qty,"product_id":line.product_id[0],"amount":line.price_subtotal});            
            }
            var invoiceLineItems = [{"advance_payment_method":"all","qtty":1,"product_id":56,"amount":150}];
            console.log(invoiceLineItems);
            $http.post(WEB_API_URL, {createinvoice:true,model:"sale.advance.payment.inv", args:invoiceLineItems, kwargs:{context:{params:{action:380},active_id:orderId, active_ids:[orderId]}}, sessionid:user.session_id}).then(function(data){
                console.log(data)
                if (data.data.data.error){deferred.reject(data);}
                var invoiceId = data.data.data.result;
                $http.post(WEB_API_URL, {assigninvoice:true,model:"sale.advance.payment.inv", args:[[invoiceId],{"params":{"action":380},"active_model":"sale.order","active_id":orderId,"active_ids":[orderId]}],  sessionid:user.session_id}).then(function(data){
                    if (data.data.data.error){deferred.reject(data);}
                    console.log(data);
                    $http.post(WEB_API_URL, {sendinvoice:true,id:invoiceId, order:order,kwargs:{context:{params:{action:380},active_id:orderId, active_ids:[orderId]}},  sessionid:user.session_id}).then(function(data){
                        console.log(data);
                        deferred.resolve(data);
                    });
                    
                },function(data){deferred.reject(data);});
                
                
                
            },function(data){deferred.reject(data);})
            
            
            
        },function(data){deferred.reject(data);});        

        return deferred.promise;                 
    }
    
    function checkData(data){
        if (data.data.result){
            return true;
        }
        return false;
    }
    
    this.getReport = function(type, search){
        var deferred = $q.defer();
        var OdooService = this;
        var user = OdooService.getUser();

        $http.post(WEB_API_URL, {report:true,model:type,search:search,sessionid:user.session_id}).  
        then(function(response) {
            console.log(response);
            if (response.data.result === true){
                  
                deferred.resolve(response.data.data);
            }
            else{deferred.reject(response);}
            }, function(response) {
                deferred.reject(response);
            });
        return deferred.promise;             
    };      
    
    
});
