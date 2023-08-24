





'use strict';




idl_test(
  ['background-sync'],
  ['service-workers', 'html', 'dom'],
  idlArray => {


    if (isServiceWorker) {
      idlArray.add_objects({
        ServiceWorkerGlobalScope: ['self', 'onsync'],
        ServiceWorkerRegistration: ['registration'],
        SyncManager: ['registration.sync'],
        SyncEvent: ['new SyncEvent("tag", "lastChance")'],
      });
  }
}
);
