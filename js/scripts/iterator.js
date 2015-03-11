module.exports = function(rows) {
  this.currentRow = 0;
  this.rows = rows;
  this.next = function() {
    return this.rows[this.currentRow++];
  };

  this.hasNext = function() {
    return this.currentRow < this.rows.length;
  }
}
