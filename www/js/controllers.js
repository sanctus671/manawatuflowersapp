angular.module('app.controllers', [])


.controller('AuctionCtrl', function($scope, OdooService, AuctionService, ionicMaterialMotion, $ionicPopup, ionicMaterialInk, $timeout, $ionicLoading) {
   
    var init = function init() {     
        $timeout(function(){ionicMaterialInk.displayEffect();ionicMaterialMotion.ripple();});
        $scope.upcomingAuctions = [];
        $scope.currentAuctionItem = {};
        $scope.auctionResult = {};
        $scope.previousAuctions = [];
        $scope.products = [];
        $scope.partners = {};
        $scope.settings = {}
        $scope.settings.autoload = true;
    };	
    OdooService.logout();
    if (!OdooService.getUser()){
        OdooService.login().then(function(data){$scope.doRefresh();});
    }
    else{$scope.doRefresh();}
    
   

    
    $scope.doRefresh = function(){
        $ionicLoading.show({
              template: 'Loading...'
            });         
        $scope.user = OdooService.getUser();
        OdooService.getAllData('product.template', 1, 999, '-id').then(function(response){
            $scope.upcomingAuctions = response.data.filter(function(data){
                return data.qty_available > 0;
            });
            if ($scope.settings.autoload && $scope.upcomingAuctions.length > 0){$scope.loadAuction($scope.upcomingAuctions[0]);}
            $timeout(function(){ionicMaterialMotion.ripple();});
        }).then(function(){
            $scope.previousAuctions = $scope.getPreviousAuctions();
            $timeout(function(){ionicMaterialMotion.ripple();});
            $ionicLoading.hide();
            $scope.$broadcast('scroll.refreshComplete'); 
        }).then(function(){
            OdooService.getAllData('res.partner', 1, 999, '-id').then(function(response){
                $scope.partners = response.data;
            })            
        });
        


    }
    
    $scope.loadAuction = function(auction){
        auction.hideItem = true;
        if ($scope.currentAuctionItem){$scope.currentAuctionItem.hideItem = false;}
        $scope.currentAuctionItem = auction;
    };
    
    $scope.getNote = function(productId){
        if (productId){
            return "This is a note for: " + productId;
        }
    };
    
    $scope.getPreviousAuctions = function(){
        return AuctionService.getPreviousAuctions();
    }
    
    $scope.viewPreviousAuction = function(auction){
        console.log(auction);
        $ionicPopup.alert({
             title: 'Auction Details',
             template: '' + auction.result.quantity + ''
           });       
    }
    
    
    $scope.passRemaining = function(){
        $scope.auctionResult.quantity = $scope.currentAuctionItem.qty_available; 
    };
    
    $scope.createOrder = function(auctionItem, auctionResult){
        var order = {product:auctionItem, result:auctionResult};
        $scope.newOrder = {lineItems:[{}], date_order:new Date()};
        console.log($scope.convertForOdoo(order));
        OdooService.addData('sale.order',$scope.convertForOdoo(order), order.result.buyer).then(function(data){ //create order
            console.log(data);
            order.orderid = data.data.data.result;
            
            $scope.previousAuctions.push(order); 
            AuctionService.addPreviousAuction(order); //save in local storage
            $timeout(function(){ionicMaterialMotion.ripple();}); 

            
                          
            OdooService.changeState('sale.order', "button_confirm", [order.orderid]).then(function(data){ //confirm order
                console.log(data);
                OdooService.getData('sale.order', [order.orderid], ["order_line", "id"]).then(function(data){ //invoice order
                    if (data.length > 0){order.order_line = data[0]["order_line"];};
                    console.log(data);
                    OdooService.createInvoice(order); //send invoice
                });    
                
                OdooService.getAllData('stock.move',1,5,'-id').then(function(data){ //confirm stock change
                    console.log(data);
                    var stock = data.data.filter(function(data){
                        return data.location_dest_id[1] === 'Partner Locations/Customers';
                    });
                    if (stock.length > 0){
                        
                        var stockItem = stock[0];
                        console.log(stockItem);
                        OdooService.changeState('stock.move', "done", [stockItem.id]).then(function(data){
                            console.log(data);
                        });
                    } 
                })
                
            });
        });
        console.log({product:auctionItem, result:auctionResult});
        console.log($scope.user);
        //create order and invoice in odoo then: & save order id
        //lineitems
        ////OdooService.addData('sale.order',newOrder.create).then(function(){
        //OdooService.changeState('sale.order', map[order.state], [order.id]);
        
        //OdooService.createInvoice(order).then(function(){

    }
    
    $scope.convertForOdoo = function(object){
        //important for odoo:
        var order = {"partner_id":object.result.buyer,"partner_invoice_id":object.result.buyer,"partner_shipping_id":object.result.buyer,"project_id":false, "client_order_ref":false,"warehouse_id":1,"pricelist_id":1,"incoterm":false,"picking_policy":"direct","order_policy":"manual","user_id":1,"section_id":false,"origin":false,"payment_term":false,"fiscal_position":false,"message_follower_ids":false,"message_ids":false};
        order["date_order"] = new Date();
        order["note"] = "Order made from auction";
        order["order_line"] = [];
        var ppu = object.result.price / object.result.quantity;
        var poductid = object.product.id + 4;
        order.order_line.push([0,false,{"delay":7,"th_weight":0,"product_packaging":false,"product_id":poductid ,"name":object.product.name,"product_uom_qty":object.result.quantity,"product_uom":1,"product_uos_qty":1,"product_uos":false,"route_id":false,"price_unit":ppu,"tax_id":[[6,false,[]]],"discount":0}]);
        
        return order;
    };    
    
    $scope.saveAuction = function(){
        if ($scope.currentAuctionItem.length < 1 || !$scope.auctionResult.quantity || !$scope.auctionResult.price || !$scope.auctionResult.buyer){return;}
        
        
        
        $scope.createOrder(angular.copy($scope.currentAuctionItem), angular.copy($scope.auctionResult));

        $scope.currentAuctionItem.qty_available -= $scope.auctionResult.quantity;
        $scope.currentAuctionItem.qty_available_text = $scope.currentAuctionItem.qty_available + " On Hand";           
        $scope.auctionResult = {};
        
        
        if ($scope.currentAuctionItem.qty_available < 1){
            console.log($scope.settings.autoload);
            $scope.currentAuctionItem = {};
            if ($scope.settings.autoload){
                for (var index in $scope.upcomingAuctions){
                    
                    if (!$scope.upcomingAuctions[index].hideItem){$scope.loadAuction($scope.upcomingAuctions[index]);console.log($scope.upcomingAuctions[index]);break;return;}
                }       
            }
        }
    };
   
    
    init();
    
});
