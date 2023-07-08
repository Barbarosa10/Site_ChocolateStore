function addToCart(idProdus){
    console.log('id: ' + idProdus + '\n');
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {

        }
    };
    xhttp.open('GET', `/adaugare_cos?id=${idProdus}`, true);
    xhttp.send();
}