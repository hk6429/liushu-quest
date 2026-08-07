// 將字庫的分類層次與引用狀態轉成學生、教師都看得懂的證據卡。
const LSEvidence = (() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  function relationText(relation) {
    const related = relation.related_chars?.length ? ` → ${relation.related_chars.join('、')}` : '';
    const method = [relation.relation_basis, relation.relation_status].filter(Boolean).join('／');
    return `${relation.type}${relation.sub ? `・${relation.sub}` : ''}${related}${method ? `（${method}）` : ''}`;
  }

  function render(char, { compact = false } = {}) {
    if (!char) return '';
    const relations = Array.isArray(char.usage_relations) ? char.usage_relations : [];
    const scope = char.classification_scope ? `・${char.classification_scope}` : '';
    const formation = char.formation_category
      ? `<span><b>字形構成：</b>${escapeHtml(char.formation_category)}</span>` : '';
    const usage = relations.length
      ? `<span><b>用字關係：</b>${relations.map(relationText).map(escapeHtml).join('；')}</span>` : '';
    const subScope = char.sub_scope ? `<span><b>教學標籤範圍：</b>${escapeHtml(char.sub_scope)}</span>` : '';
    return `<div class="evidence-block${compact ? ' is-compact' : ''}">
      <p class="evidence-scope"><span><b>本庫主分類：</b>${escapeHtml(char.category)}${escapeHtml(scope)}</span>${formation}${usage}${subScope}</p>
      ${relations.some(relation => relation.note) && !compact ? `<p class="evidence-note">${relations.map(relation => relation.note).filter(Boolean).map(escapeHtml).join(' ')}</p>` : ''}
    </div>`;
  }

  return { render };
})();
