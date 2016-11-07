/** 地址联动选择指令
 *  实现省份、城市和区域联动选择功能
 *
 */
(function () {
	'use strict';
	angular
		.module('xl.address', [])
		.run(['$templateCache', xlAddressTemplate])
		.directive('xlAddressSelect', ['$compile', '$parse', 'xlAddressConf', xlAddressDirective])
		.provider('xlAddressConf', xlAddressConfProvider);

	function xlAddressTemplate($templateCache) {
		$templateCache.put('xltpl/address.tpl.html', '<div class="address-block"><div class="addr-selected"><span class="btn btn-default form-control"><span ng-show="!addrEmpty() && !disFlag"><a class="btn btn-xs btn-link pull-right" ng-click="clearAddr($event)"><i class="glyphicon glyphicon-remove" aria-hidden="true"></i></a></span><span class="placeholder" ng-show="addrEmpty()" ng-bind="placeholder"></span><span ng-bind="addrSelected[0].name"></span><span ng-bind="addrSelected[1].name"></span><span ng-bind="addrSelected[2].name"></span><span ng-bind="addrSelected[3].name"></span></span></div><div class="addr-select-box" ng-class="{active: isVisible}"><div class="b-b b-blue nav-active-blue"><ul class="nav nav-tabs"><li class="nav-item" ng-repeat="(idx, pane) in panes"><a class="nav-link" ng-class="{active: activeIdx == idx}" href data-toggle="tab" data-target="#addr-selection" ng-click="setActive(idx)" ng-bind="pane.title"></a></li></ul></div><div class="tab-content p-t-sm p-l"><div class="tab-pane animated fadeIn text-muted active" id="addr-selection"><a ng-class="itemWidth(selection.name)" ng-repeat="selection in selctions[activeIdx]" ng-click="setAddr($event, activeIdx, selection)" ng-bind="selection.name"></a></div></div></div></div>');
	}

	function xlAddressDirective($compile, $parse, xlAddressConf) {
		return {
			restrict: 'EA',
			replace: true,
			scope: {
				placeholder: '@',
				addrSelected: '=?',
				addrCallback: '&',
				addrClearfun: '&'
			},
			templateUrl: function (ele, attrs) {
				return attrs.tplUrl || xlAddressConf.getTplPath;
			},
			controller: ['$scope', '$element', '$attrs', '$http', xlAddressDirectiveCtrl],
			link: xlAddressDirectiveLink
		}

		function xlAddressDirectiveCtrl(scope, ele, attrs, $http) {

			// 保存省、市、区县和街道的可选择数据
			scope.selctions = [];
			
			// 初始请求所有省份
			$http({
				method: 'GET',
				url: 'http://restapi.amap.com/v3/config/district',
				params: {
					key: '4138a6732fa2db614007b539498e3d01',
					showbiz: false,
					subdistrict: 1
				}
			}).then(function (json) {
				scope.selctions.push(json.data.districts[0].districts);
			})
			
			// 保存每个tab的标题
			scope.panes = [{
				title: '省份'
			}, {
				title: '城市'
			}, {
				title: '区县'
			}, {
				title: '街道'
			}];
			// 标识地址选择控件是否可见
			scope.isVisible = false;
			// 标识当前激活tab，初始化时为城市
			scope.activeIdx = 0;
			// 地址选择控件是否可选
			scope.disFlag = typeof(attrs.addrDisabled) == 'undefined' ? false : true;
			
			scope.toggle = function () {
				scope.isVisible = !scope.isVisible;
			};

			scope.setActive = function (paneIdx) {
				scope.activeIdx = paneIdx;
			};
			
			scope.setAddr = function (evt, index, obj) {
				evt && evt.stopPropagation();
				var newSelected = [];
				// 清除当前tab及之后tab所选择的数据
				if (scope.addrSelected) {
					newSelected = scope.addrSelected.slice(0, index);
				}
				if (scope.selctions.length > index+1) {
					scope.selctions = scope.selctions.slice(0, index+1);
				}

				newSelected[index] = angular.copy(obj);
				if (index < scope.panes.length-1) {

					$http({
						method: 'GET',
						url: 'http://restapi.amap.com/v3/config/district',
						params: {
							key: '4138a6732fa2db614007b539498e3d01',
							keywords: obj.adcode,
							showbiz: false,
							subdistrict: 1
						}
					}).then(function (json) {
						var tmpSeles = json.data.districts[0].districts;
						scope.selctions[index+1] = tmpSeles;
						
						if (tmpSeles.length < 1) {
							scope.toggle();
							scope.addrSelected = newSelected;
							scope.addrCallback({addr: scope.addrSelected});
							return;
						} else if (tmpSeles.length < 2) {
							scope.setAddr(null, index+1, tmpSeles[0]);
							return;
						} else {
							scope.setActive(index+1);
						}
						
					})
				} else {
					scope.toggle();
					// ele.find('.addr-select-box').removeClass('active');
				}

				scope.addrSelected = newSelected;

				if (index == scope.panes.length-1) {
					scope.addrCallback({addr: scope.addrSelected});
				}
				
			}
			// 根据文字长度计算每个选择按钮的宽度
			scope.itemWidth = function (itemName) {
				var len = itemName.length;
				var level = Math.round(len/4)+1;
				return 'col-md-' + level;
			}

			scope.addrEmpty = function () {
				return !scope.addrSelected || scope.addrSelected.length == 0;
			}
			// 清除已选地址数据
			scope.clearAddr = function (evt) {
				scope.addrSelected = [];
				scope.setActive(0);
				scope.addrClearfun();
				evt.stopPropagation();
			}

			function findAdcode(code, tree) {
				if (tree.length < 1) {
					return {};
				}
				for (var i = 0, ele; ele = tree[i++];) {
					if (ele.adcode === code) {
						return ele;
					}
					var temp = findAdcode(code, ele.districts);
					if (temp.adcode === code) {
						return temp;
					}
				}
				return {};
			}

			function clickAll(tree, index) {
				if (index === 3) {
					return;
				}
				for (var i = 0, len = tree.length; i = len; i++) {
					scope.setAddr(null, index, tree[i]);
					clickAll(scope.selctions[index+1], index+1);
				}
			}
		}

		function xlAddressDirectiveLink(scope, ele, attrs) {
			ele = ele[0];

			ele.querySelector('.addr-selected').addEventListener('click', function (e) {
				e.stopPropagation();
				if (!scope.disFlag) {
					toggleSelectBox();
				}
			})

	        angular.element(document).on('click', onDocumentClick);

	        scope.$on('$destroy', function () {
	        	angular.element(document).off('click', onDocumentClick);
	        });

	        function onDocumentClick(e) {
	        	if (!scope.isVisible) return;

		        if (!ele.contains(e.target)) {
		        	toggleSelectBox();
		        }
	        }

	        function toggleSelectBox() {
	        	scope.toggle();
	        	scope.$apply();
	        }
		}
	}

	function xlAddressConfProvider() {
		var tplPath = 'xltpl/address.tpl.html';

		this.setTplPath = function (path) {
			tplPath = path;
		}

		this.$get = function () {
			return {
				getTplPath: tplPath
			}
		}
	}
})();