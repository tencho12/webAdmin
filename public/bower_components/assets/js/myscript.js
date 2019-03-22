

new Vue({
    el: '#myedit',
    data: {
      count: 2
    },
    methods: {
      fetchData: function() {
      }
    }
  });


document.getElementById('editme').addEventListener('click',EditDetail);
function EditDetail(){
  var user_id = button.getAttribute('data-userid');
  console.log(user_id);
  console.log("working");
}