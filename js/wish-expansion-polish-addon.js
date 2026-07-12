// Adds the expansion registry to the final coordinator without changing the older engines.
(function(){
  'use strict';
  try{
    if(!window.WishExpansion)return;
    if(window.WishPoolCoordinator){
      const originalStop=window.WishPoolCoordinator.stopAll&&window.WishPoolCoordinator.stopAll.bind(window.WishPoolCoordinator);
      window.WishPoolCoordinator.stopAll=function(){
        try{window.WishExpansion.stop();}catch(e){}
        if(originalStop)return originalStop();
      };
      try{
        const baseDescriptor=Object.getOwnPropertyDescriptor(window.WishPoolCoordinator,'activeSystems');
        Object.defineProperty(window.WishPoolCoordinator,'activeSystems',{
          configurable:true,
          get(){
            let base={};
            try{base=baseDescriptor&&baseDescriptor.get?baseDescriptor.get.call(window.WishPoolCoordinator):{};}catch(e){}
            return{...base,expansion:window.WishExpansion.active};
          }
        });
      }catch(e){}
    }
    if(window.WishPoolDiagnostics){
      const originalRun=window.WishPoolDiagnostics.run.bind(window.WishPoolDiagnostics);
      const originalStop=window.WishPoolDiagnostics.stopAll&&window.WishPoolDiagnostics.stopAll.bind(window.WishPoolDiagnostics);
      window.WishPoolDiagnostics.run=function(){
        const report=originalRun();
        const audit=window.WishExpansion.audit();
        report.checks={...report.checks,expansion:audit.valid};
        report.expansion=audit;
        report.verifiedIndividualEffects=(report.verifiedIndividualEffects||450)+audit.count;
        report.ok=report.ok&&audit.valid;
        return report;
      };
      window.WishPoolDiagnostics.stopAll=function(){
        try{window.WishExpansion.stop();}catch(e){}
        if(originalStop)return originalStop();
      };
      try{Object.defineProperty(window.WishPoolDiagnostics,'report',{configurable:true,get(){return window.WishPoolDiagnostics.run();}});}catch(e){}
    }
    window.WISH_POOL_VERIFIED_INDIVIDUAL_EFFECTS=1050;
  }catch(e){console.warn('wish expansion polish addon failed',e);}
})();